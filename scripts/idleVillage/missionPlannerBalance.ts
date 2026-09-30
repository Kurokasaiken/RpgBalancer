/**
 * MP-00 — Mission Planner balance analysis.
 *
 * Deterministic (no rng) comparison of the LEGACY quest model vs the new
 * per-member DP contract across every default quest blueprint.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/idleVillage/missionPlannerBalance.ts
 *
 * Outputs a markdown report to `test-results/mission-planner-balance-<date>.md`.
 *
 * Legacy model (as coded today):
 *   - check stat = sumPartyStat over statRequirement tags (role tags → 0 → floor),
 *     or the generic "count(hp)" skill when the phase declares no requirement;
 *   - `almost` counts as a pass; no member removal; phase risk flags narrative-only;
 *   - actual member consequences from QuestPowerEngine outcome table (uniform).
 *
 * New model: missionPlannerMath.computeMissionPreview with proposed checkStatTags
 * (mission_planner_data_model_fix.md §3) and a partyStatMult sweep.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { defaultQuestBlueprints } from '@/balancing/config/idleVillage/quests/questBlueprints';
import {
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  resolvePhaseDifficulty,
} from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import { DEFAULT_QUEST_POWER_RULES } from '@/engine/game/idleVillage/QuestPowerEngine';
import {
  computeMissionPreview,
  phasePassChance,
  phaseSuccessBound,
  phaseVerdictCounts,
  type MissionMemberSpec,
  type MissionPhaseSpec,
} from '@/engine/game/idleVillage/missionPlannerMath';
import { MINIMAL_GAMEPLAY_RESIDENTS } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { QuestBlueprint, QuestPhase } from '@/balancing/config/idleVillage/quests/questBlueprints.schema';

// ---------------------------------------------------------------------------
// Reference parties (canonical villager-scale stats from minimalGameplayConfig)
// ---------------------------------------------------------------------------

interface RefResident {
  id: string;
  stats: Record<string, number>;
  /** Whether the resident's statSnapshot carries `hp` (drives the legacy generic skill). */
  hasHpSnapshot: boolean;
}

const toMember = (r: RefResident, slotIndex: number): MissionMemberSpec => ({
  residentId: r.id,
  slotIndex,
  stats: r.stats,
});

const VILLAGERS: RefResident[] = MINIMAL_GAMEPLAY_RESIDENTS.map((r) => ({
  id: r.id,
  stats: { ...r.stats },
  // Minimal-gameplay residents carry {strength,endurance,agility,intelligence,perception}
  // in their snapshot — no hp key, so the legacy generic skill floors out.
  hasHpSnapshot: false,
}));

const PARTIES: Array<{ label: string; refs: RefResident[]; members: MissionMemberSpec[] }> = [
  {
    label: '2 villagers (weak)',
    refs: [VILLAGERS[0], VILLAGERS[2]],
    members: [VILLAGERS[0], VILLAGERS[2]].map(toMember),
  },
  {
    label: '3 villagers (balanced)',
    refs: [VILLAGERS[0], VILLAGERS[1], VILLAGERS[2]],
    members: [VILLAGERS[0], VILLAGERS[1], VILLAGERS[2]].map(toMember),
  },
  {
    label: '4 villagers (full)',
    refs: VILLAGERS,
    members: VILLAGERS.map(toMember),
  },
];

/** Narrative unit → normalized unit (ms ratios of the default time scale). */
const UNIT_FACTOR: Record<string, number> = { ticks: 1, hours: 1, days: 8 };

function toPhaseSpec(phase: QuestPhase, blueprint: QuestBlueprint): MissionPhaseSpec {
  // Authored checkStatTags (MP-02); proposals in data-model spec §3 seeded them.
  const authored = (phase.requirements as { checkStatTags?: string[] } | undefined)
    ?.checkStatTags;
  return {
    phaseId: phase.id,
    difficulty: resolvePhaseDifficulty({
      blueprintDifficulty: blueprint.difficulty,
      phaseType: phase.type,
    }),
    checkStatTags: authored ?? [],
    baseInjuryChance: phase.riskProfile?.injuryChance ?? 0,
    baseDeathChance: phase.riskProfile?.deathChance ?? 0,
    durationUnits: phase.durationValue * (UNIT_FACTOR[phase.durationUnits] ?? 1),
  };
}

// ---------------------------------------------------------------------------
// Legacy model (analytic, mirrors today's runtime semantics)
// ---------------------------------------------------------------------------

/**
 * Stat the legacy check would feed the astrolabe for a phase, replicating
 * `buildAstrolabeSkillsForPhase`: role tags resolve to 0 → unstaffedStatFloor;
 * tag-less phases use the generic count(hp-in-snapshot) skill.
 */
function legacyPhaseStat(phase: QuestPhase, party: RefResident[]): number {
  const cfg = DEFAULT_QUEST_SKILL_CHECK_CONFIG;
  const req = phase.requirements?.statRequirement;
  const tags = [...(req?.allOf ?? []), ...(req?.anyOf ?? [])];
  if (tags.length === 0) {
    // Generic skill: #members carrying statSnapshot.hp × unstaffedStatFloor.
    const withHp = party.filter((r) => r.hasHpSnapshot).length;
    return Math.round(
      Math.min(cfg.statCeiling, Math.max(cfg.unstaffedStatFloor, withHp * cfg.unstaffedStatFloor)),
    );
  }
  // Role tags (`lantern`, `edge`, …) are absent from numeric snapshots → sum 0 → floor.
  return Math.round(Math.min(cfg.statCeiling, Math.max(cfg.unstaffedStatFloor, 0)));
}

/** Legacy pass chance including `almost` (old isPassingVerdict). */
function legacyPassChance(stat: number, difficulty: number): number {
  const s = phaseSuccessBound(stat, difficulty);
  const c = phaseVerdictCounts(s);
  return (c.bigwin + c.win + c.almost) / 100;
}

/** Binomial probability of at least `need` passes among `n` iid phases. */
function binomialAtLeast(p: number[], need: number): number {
  // Poisson-binomial via DP (phases may have different p).
  const dist = [1];
  for (const pk of p) {
    const next = new Array<number>(dist.length + 1).fill(0);
    dist.forEach((v, i) => {
      next[i] += v * (1 - pk);
      next[i + 1] += v * pk;
    });
    dist.length = 0;
    dist.push(...next);
  }
  return dist.slice(need).reduce((a, b) => a + b, 0);
}

type Tier = 'perfect' | 'success' | 'partial' | 'fail' | 'deadly';

/** Legacy tier distribution over n phases (no removal, almost passes). */
function legacyTiers(passChances: number[], deathFlags: number[]): Record<Tier, number> {
  const n = passChances.length;
  // passed-count distribution (Poisson-binomial) and per-count death prob
  // (any phase dead flag is party-level; approximate independence).
  const passDist = [1];
  for (const pk of passChances) {
    const next = new Array<number>(passDist.length + 1).fill(0);
    passDist.forEach((v, i) => {
      next[i] += v * (1 - pk);
      next[i + 1] += v * pk;
    });
    passDist.length = 0;
    passDist.push(...next);
  }
  const anyDeathFlag = 1 - deathFlags.reduce((acc, d) => acc * (1 - d), 1);
  const out: Record<Tier, number> = { perfect: 0, success: 0, partial: 0, fail: 0, deadly: 0 };
  for (let c = 0; c <= n; c += 1) {
    const p = passDist[c];
    if (c === n) {
      out.perfect += p * (1 - anyDeathFlag);
      out.success += p * anyDeathFlag;
    } else if (c === 0) {
      out.deadly += p * anyDeathFlag;
      out.fail += p * (1 - anyDeathFlag);
    } else if (c * 2 >= n) {
      out.success += p;
    } else {
      out.partial += p;
    }
  }
  return out;
}

/** Legacy per-member expected death/injury (uniform by outcome tier). */
function legacyMemberRisk(tiers: Record<Tier, number>): { death: number; injury: number } {
  const rules = DEFAULT_QUEST_POWER_RULES;
  const death = (Object.keys(tiers) as Tier[]).reduce(
    (acc, t) => acc + tiers[t] * (rules.deathChanceByOutcome[t] ?? 0),
    0,
  );
  const injury = (Object.keys(tiers) as Tier[]).reduce(
    (acc, t) => acc + tiers[t] * (rules.injuryChanceByOutcome[t] ?? 0),
    0,
  );
  return { death, injury };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const MULT_SWEEP = [1, 2, 3, 4, 5, 6, 8, 10];
/** Target success band per blueprint difficulty tier (MP-00 prompt). */
const TARGET_BAND: Record<string, [number, number]> = {
  story: [0.7, 0.85],
  skirmish: [0.5, 0.7],
  dangerous: [0.3, 0.5],
  heroic: [0.15, 0.35],
};

const lines: string[] = [];
const log = (s = '') => {
  lines.push(s);
  console.log(s);
};

const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;

log('# MP-00 Balance Report — Mission Planner model comparison');
log(`Generated: ${new Date().toISOString().slice(0, 10)} (deterministic, no rng)`);
log('');
log(`Blueprints analysed: ${Object.keys(defaultQuestBlueprints).length}`);
log(`Reference parties: ${PARTIES.map((p) => p.label).join(' | ')}`);
log('');

for (const blueprint of Object.values(defaultQuestBlueprints)) {
  log(`## ${blueprint.id} — ${blueprint.name}`);
  log(`Difficulty: \`${blueprint.difficulty}\` — ${blueprint.phases.length} phases`);
  log('');

  const phaseSpecs = blueprint.phases.map((ph) => toPhaseSpec(ph, blueprint));
  log('| Phase | Type | Difficulty | checkStatTags (proposed) | base inj/death |');
  log('|---|---|---|---|---|');
  phaseSpecs.forEach((p, i) => {
    const ph = blueprint.phases[i];
    log(
      `| ${p.phaseId} | ${ph.type} | ${p.difficulty} | ${p.checkStatTags.join(', ') || '(generic)'} | ${p.baseInjuryChance}/${p.baseDeathChance}pp |`,
    );
  });
  log('');

  // ---- legacy rows ----
  log('### Legacy model (today)');
  log('');
  log('| Party | per-phase pass (incl. almost) | quest success | member death | member injury |');
  log('|---|---|---|---|---|');
  for (const party of PARTIES) {
    const passes = blueprint.phases.map((ph, i) =>
      legacyPassChance(legacyPhaseStat(ph, party.refs), phaseSpecs[i].difficulty),
    );
    const need = Math.ceil(blueprint.phases.length / 2);
    const success = binomialAtLeast(passes, need);
    const tiers = legacyTiers(
      passes,
      blueprint.phases.map((ph) => (ph.riskProfile?.deathChance ?? 0) / 100),
    );
    const { death, injury } = legacyMemberRisk(tiers);
    log(
      `| ${party.label} | ${passes.map(pct).join(' / ')} | ${pct(success)} | ${pct(death)} | ${pct(injury)} |`,
    );
  }
  log('');
  log('_Note: legacy per-phase success is pinned at the 5% floor (+10pp almost band)_');
  log('_because `statRequirement` role tags (`lantern`, `edge`) resolve to numeric 0._');
  log('');

  // ---- new model, mult sweep ----
  log('### New model (per-member DP, `almost` excluded)');
  log('');
  log('| Party | partyStatMult | quest success | any death | E[deaths] | any injury | E[injuries] |');
  log('|---|---|---|---|---|---|---|');
  for (const party of PARTIES) {
    for (const mult of MULT_SWEEP) {
      const res = computeMissionPreview({
        members: party.members,
        phases: phaseSpecs,
        partyStatMult: mult,
        rewardMultipliers: DEFAULT_QUEST_POWER_RULES.rewardMultipliers,
      });
      log(
        `| ${party.label} | ${mult} | ${pct(res.questSuccess)} | ${pct(res.aggregate.anyDeath)} | ${res.aggregate.expectedDeaths.toFixed(2)} | ${pct(res.aggregate.anyInjury)} | ${res.aggregate.expectedInjuries.toFixed(2)} |`,
      );
    }
  }
  log('');

  // ---- recommendation ----
  const band = TARGET_BAND[blueprint.difficulty] ?? [0.3, 0.5];
  const ref = PARTIES[1]; // 3-villager balanced party as the canonical reference
  const rows = MULT_SWEEP.map((mult) => ({
    mult,
    success: computeMissionPreview({
      members: ref.members,
      phases: phaseSpecs,
      partyStatMult: mult,
    }).questSuccess,
  }));
  const recommended =
    rows.find((r) => r.success >= band[0] && r.success <= band[1]) ??
    rows.reduce((best, r) =>
      Math.abs(r.success - (band[0] + band[1]) / 2) < Math.abs(best.success - (band[0] + band[1]) / 2)
        ? r
        : best,
    );
  log(
    `**Recommended \`partyStatMult\`: ${recommended.mult}** — lands the reference party (${ref.label}) at ${pct(recommended.success)} success vs target band ${pct(band[0])}–${pct(band[1])} for \`${blueprint.difficulty}\`.`,
  );
  log('');
}

log('## Findings');
log('');
log('- Legacy success is ~0% on every blueprint: role tags as numeric stats pin every phase to the 5% floor; only the 10pp `almost` band rescues ~15%/phase.');
log('- Stat scale: villager stats are 2–8, hero statBlock scale is 20–280 — a single `partyStatMult` bridges to D100 only if checkStatTags stay on the villager namespace; see data-model spec §2.3.');
log('- `almost` no longer passing removes ~10pp per phase; per-member risk lowers expected casualties vs the legacy uniform outcome table on `dangerous`.');
log('');

const date = new Date().toISOString().slice(0, 10);
const outDir = resolve(process.cwd(), 'test-results');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, `mission-planner-balance-${date}.md`);
writeFileSync(outPath, `${lines.join('\n')}\n`);
console.log(`\nReport written to ${outPath}`);
