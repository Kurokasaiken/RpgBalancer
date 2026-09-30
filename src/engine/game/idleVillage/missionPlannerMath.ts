/**
 * Mission Planner math — reference implementation of the canonical contract.
 *
 * Normative source: `src/docs/docs/idle_village/mission_planner_math_spec.md`.
 * Pure and rng-free: the Planner shows exactly this distribution, and the quest
 * resolver (MP-06) must sample the same model — never a parallel one.
 *
 * Model summary:
 * - phase check = weakest-skill D100 with the same band semantics as
 *   `resolveMilestoneWithoutAnimation`; pass = `win | bigwin` (never `almost`);
 * - per-member per-phase risk roll (death > injury, exclusive); death removes
 *   the member from later phases (stats and rolls), injury does not;
 * - exact forward DP over `(phase, alive-set, passed-count)` — O(n·3^m).
 */

import {
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  type QuestSkillCheckConfig,
} from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import type { QuestOutcomeTier } from './questMilestones';

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** One drafted party member, ordered by slot index. */
export interface MissionMemberSpec {
  residentId: string;
  slotIndex: number;
  /** Effective numeric stats after loadout (MP-03 output; raw statSnapshot in v0). */
  stats: Record<string, number>;
  /** Personal additive risk deltas in percentage points (slot + equipment). */
  injuryChanceDelta?: number;
  deathChanceDelta?: number;
  /**
   * Cover (D1): pp delta applied to every OTHER living member's risk while this
   * member is alive. Negative values protect.
   */
  coverInjuryChanceDelta?: number;
  coverDeathChanceDelta?: number;
}

/** One quest phase as consumed by the model (difficulty already resolved). */
export interface MissionPhaseSpec {
  phaseId: string;
  /** Resolved D100 target (`resolvePhaseDifficulty`). */
  difficulty: number;
  /** Numeric stat keys summed across the living party; empty → generic skill. */
  checkStatTags: readonly string[];
  /** Authored base risk in percentage points (`riskProfile`). */
  baseInjuryChance: number;
  baseDeathChance: number;
  /** Authored duration in normalized units (questTimeScale). */
  durationUnits: number;
}

/** Party-pool consumable (D3): deltas apply to every living member's roll. */
export interface MissionConsumableSpec {
  itemId: string;
  injuryChanceDelta?: number;
  deathChanceDelta?: number;
  rewardMultiplierDelta?: number;
  durationDelta?: number;
  durationMult?: number;
}

/**
 * Quest-level effect of an equipped item (duration/reward only — member-level
 * stat/risk/cover deltas live on {@link MissionMemberSpec}).
 */
export interface MissionItemEffect {
  itemId: string;
  durationDelta?: number;
  durationMult?: number;
  rewardMultiplierDelta?: number;
}

/** Full planner draft + rules. */
export interface MissionPlannerInput {
  members: readonly MissionMemberSpec[];
  phases: readonly MissionPhaseSpec[];
  consumables?: readonly MissionConsumableSpec[];
  /** Quest-level effects contributed by equipped items (mount, relics…). */
  itemEffects?: readonly MissionItemEffect[];
  /** Aggregate pp delta from empty required slots (shared penalty). */
  emptySlotPenalty?: { injuryChanceDelta?: number; deathChanceDelta?: number };
  rewardMultipliers?: Partial<Record<QuestOutcomeTier, number>>;
  /** Stat-sum → D100 scale bridge (D4); defaults to 1. */
  partyStatMult?: number;
  /** Floor for resolved duration, in normalized units. */
  durationMin?: number;
}

/** WHY attribution entry (canonical order: math spec §3.4). */
export interface MissionContribution {
  metric: 'success' | 'injury' | 'death' | 'duration' | 'reward';
  source:
    | 'phase'
    | 'slot'
    | 'emptyPenalty'
    | 'equipment'
    | 'cover'
    | 'consumable'
    | 'stat'
    | 'clamp';
  sourceId: string;
  /** Effect in percentage points (or units for duration, multiplier for reward). */
  delta: number;
  /** Member affected (omitted for party-level metrics). */
  residentId?: string;
  /** Cover provider when source = 'cover'. */
  providerId?: string;
}

export interface MissionPreviewResult {
  questSuccess: number;
  tiers: Record<QuestOutcomeTier, number>;
  phases: Array<{
    phaseId: string;
    /** E[pass | phase reached] — pass chance of whoever is alive at that point. */
    passChance: number;
    /** P(at least one member alive after this phase). */
    surviveThrough: number;
    /** Tier distribution if the player retreats after this phase, conditional on reaching it. */
    retreatTiers: Record<QuestOutcomeTier, number>;
  }>;
  members: Array<{
    residentId: string;
    deathChance: number;
    injuryChance: number;
    unscathedChance: number;
  }>;
  aggregate: {
    anyDeath: number;
    anyInjury: number;
    expectedDeaths: number;
    expectedInjuries: number;
  };
  duration: number;
  expectedRewardMultiplier: number;
  contributions: MissionContribution[];
}

// ---------------------------------------------------------------------------
// Phase check (mirrors resolveMilestoneWithoutAnimation, no rng)
// ---------------------------------------------------------------------------

const clampPp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const countBits = (mask: number): number => {
  let m = mask;
  let c = 0;
  while (m) {
    m &= m - 1;
    c += 1;
  }
  return c;
};

/** Discrete verdict-roll counts (out of 100) for a success bound `s`. */
export function phaseVerdictCounts(
  successBound: number,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): { epicfail: number; bigwin: number; win: number; almost: number; fail: number } {
  const t = config.backgroundResolution;
  const epicMax = t.epicFailThreshold - 1; // rolls at/above threshold are epicfail first
  const epicfail = 100 - t.epicFailThreshold + 1;
  const bigwin = Math.max(
    0,
    Math.min(Math.floor(successBound * t.criticalWinFraction), epicMax),
  );
  const winBound = Math.max(0, Math.min(Math.floor(successBound), epicMax));
  const win = winBound - bigwin;
  const almost = Math.max(
    0,
    Math.min(Math.floor(successBound + t.nearMissBand), epicMax) - winBound,
  );
  return { epicfail, bigwin, win, almost, fail: 100 - epicfail - bigwin - win - almost };
}

/**
 * Success bound `s` in pp for a party stat vs difficulty — the raw clamped
 * value, unrounded (the milestone resolver uses it unrounded).
 */
export function phaseSuccessBound(
  stat: number,
  difficulty: number,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): number {
  const t = config.backgroundResolution;
  return clampPp(stat - difficulty + t.parSuccessChance, t.successFloor, t.successCeiling);
}

/** Exact pass probability (win + bigwin) of one phase check. */
export function phasePassChance(
  stat: number,
  difficulty: number,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): number {
  const counts = phaseVerdictCounts(phaseSuccessBound(stat, difficulty, config), config);
  return (counts.bigwin + counts.win) / 100;
}

/**
 * Aggregated party stat for the weakest check tag of a phase, given the alive
 * set as a bitmask over `members`. Returns the clamped D100-scale stat.
 */
export function phaseWeakestStat(
  members: readonly MissionMemberSpec[],
  aliveMask: number,
  phase: MissionPhaseSpec,
  partyStatMult: number,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): { stat: number; tag: string | null } {
  const clampStat = (value: number): number =>
    Math.round(clampPp(value, config.unstaffedStatFloor, config.statCeiling));

  if (phase.checkStatTags.length === 0) {
    // Generic party-size skill: deliberately unscaled by partyStatMult
    // (spec §2.3 — the multiplier only bridges declared stat sums).
    return {
      stat: clampStat(countBits(aliveMask) * config.unstaffedStatFloor),
      tag: null,
    };
  }

  let best: { stat: number; tag: string } | null = null;
  for (const tag of phase.checkStatTags) {
    let sum = 0;
    for (let i = 0; i < members.length; i += 1) {
      if (!(aliveMask & (1 << i))) continue;
      const v = members[i].stats[tag];
      if (typeof v === 'number' && Number.isFinite(v)) sum += v;
    }
    const stat = clampStat(sum * partyStatMult);
    if (!best || stat - phase.difficulty < best.stat - phase.difficulty) {
      best = { stat, tag };
    }
  }
  return best!;
}

// ---------------------------------------------------------------------------
// Per-member phase risk (math spec §3)
// ---------------------------------------------------------------------------

interface MemberPhaseRisk {
  death: number;
  injury: number;
}

const sumDelta = (
  items: readonly MissionConsumableSpec[],
  key: 'injuryChanceDelta' | 'deathChanceDelta' | 'rewardMultiplierDelta' | 'durationDelta',
): number => items.reduce((acc, it) => acc + (it[key] ?? 0), 0);

/**
 * Effective death/injury chances (fractions) for member `i` in a phase, given
 * the alive set. All terms additive in pp, clamped once at the end; injury is
 * truncated so death + injury ≤ 100 (death has priority on the single roll).
 */
export function memberPhaseRisk(
  members: readonly MissionMemberSpec[],
  memberIndex: number,
  phase: MissionPhaseSpec,
  aliveMask: number,
  consumables: readonly MissionConsumableSpec[] = [],
  emptySlotPenalty?: MissionPlannerInput['emptySlotPenalty'],
): MemberPhaseRisk {
  const member = members[memberIndex];

  let coverD = 0;
  let coverW = 0;
  for (let j = 0; j < members.length; j += 1) {
    if (j === memberIndex || !(aliveMask & (1 << j))) continue;
    coverD += members[j].coverDeathChanceDelta ?? 0;
    coverW += members[j].coverInjuryChanceDelta ?? 0;
  }

  const death = clampPp(
    phase.baseDeathChance +
      (member.deathChanceDelta ?? 0) +
      sumDelta(consumables, 'deathChanceDelta') +
      (emptySlotPenalty?.deathChanceDelta ?? 0) +
      coverD,
    0,
    100,
  );
  const rawInjury = clampPp(
    phase.baseInjuryChance +
      (member.injuryChanceDelta ?? 0) +
      sumDelta(consumables, 'injuryChanceDelta') +
      (emptySlotPenalty?.injuryChanceDelta ?? 0) +
      coverW,
    0,
    100,
  );
  return { death: death / 100, injury: Math.min(rawInjury, 100 - death) / 100 };
}

// ---------------------------------------------------------------------------
// Exact DP (math spec §4)
// ---------------------------------------------------------------------------

const TIERS: readonly QuestOutcomeTier[] = ['perfect', 'success', 'partial', 'fail', 'deadly'];

const emptyTiers = (): Record<QuestOutcomeTier, number> => ({
  perfect: 0,
  success: 0,
  partial: 0,
  fail: 0,
  deadly: 0,
});

const roundTiers = (t: Record<QuestOutcomeTier, number>): Record<QuestOutcomeTier, number> => ({
  perfect: round6(t.perfect),
  success: round6(t.success),
  partial: round6(t.partial),
  fail: round6(t.fail),
  deadly: round6(t.deadly),
});

const round6 = (x: number): number => Math.round(x * 1e6) / 1e6;

/** Terminal tier for `passed` out of `played` phases (math spec §4.2). */
export function classifyTier(passed: number, played: number, anyDeath: boolean): QuestOutcomeTier {
  if (played <= 0) return 'fail';
  if (passed === played) return anyDeath ? 'success' : 'perfect';
  if (passed === 0) return anyDeath ? 'deadly' : 'fail';
  return passed * 2 >= played ? 'success' : 'partial';
}

function zeroedResult(input: MissionPlannerInput): MissionPreviewResult {
  return {
    questSuccess: 0,
    tiers: { ...emptyTiers(), fail: 1 },
    phases: input.phases.map((p) => ({
      phaseId: p.phaseId,
      passChance: 0,
      surviveThrough: 0,
      retreatTiers: emptyTiers(),
    })),
    members: input.members.map((member) => ({
      residentId: member.residentId,
      deathChance: 0,
      injuryChance: 0,
      unscathedChance: 0,
    })),
    aggregate: { anyDeath: 0, anyInjury: 0, expectedDeaths: 0, expectedInjuries: 0 },
    duration: input.durationMin ?? 1,
    expectedRewardMultiplier: 0,
    contributions: [],
  };
}

/**
 * Computes the exact outcome distribution of a planner draft.
 * Pure: same inputs → identical outputs; no rng, no mutation of inputs.
 *
 * Single forward pass accumulating:
 * - `F`:      mass reaching (phase-start, alive-mask, passed-count)
 * - `AAll`:   mass along paths with no injury event at all (→ aggregate.anyInjury)
 * - `A[i]`:   mass where member i is alive and never injured (→ per-member marginals)
 * - per-phase arrival mass, joint pass mass, wipe mass and retreat tiers.
 */
export function computeMissionPreview(
  input: MissionPlannerInput,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): MissionPreviewResult {
  const { members, phases } = input;
  const m = members.length;
  const n = phases.length;
  if (m === 0 || n === 0) return zeroedResult(input);

  const mult = input.partyStatMult ?? 1;
  const consumables = input.consumables ?? [];
  const fullMask = (1 << m) - 1;
  const maskCount = 1 << m;
  const cellCount = maskCount * (n + 1);
  const cell = (mask: number, c: number) => mask * (n + 1) + c;

  // Memoized per-phase quantities.
  const passCache: number[][] = phases.map(() => Array(maskCount).fill(-1));
  const riskCache: MemberPhaseRisk[][][] = phases.map(() =>
    Array.from({ length: maskCount }, () => []),
  );
  const passOf = (k: number, mask: number): number => {
    const cached = passCache[k][mask];
    if (cached >= 0) return cached;
    const { stat } = phaseWeakestStat(members, mask, phases[k], mult, config);
    const p = phasePassChance(stat, phases[k].difficulty, config);
    passCache[k][mask] = p;
    return p;
  };
  const riskOf = (k: number, mask: number, i: number): MemberPhaseRisk => {
    const cached = riskCache[k][mask][i];
    if (cached) return cached;
    const r = memberPhaseRisk(members, i, phases[k], mask, consumables, input.emptySlotPenalty);
    riskCache[k][mask][i] = r;
    return r;
  };

  let F = new Float64Array(cellCount);
  let AAll = new Float64Array(cellCount);
  let A = members.map(() => new Float64Array(cellCount));
  F[cell(fullMask, 0)] = 1;
  AAll[cell(fullMask, 0)] = 1;
  A.forEach((arr) => {
    arr[cell(fullMask, 0)] = 1;
  });

  const phaseOut: MissionPreviewResult['phases'] = [];
  // Injury-free mass absorbed by wipes (dead members roll no injury) — kept
  // out of the F/A arrays because wipe states never continue.
  let wipeNoInjuryMass = 0;

  for (let k = 0; k < n; k += 1) {
    const nextF = new Float64Array(cellCount);
    const nextAAll = new Float64Array(cellCount);
    const nextA = members.map(() => new Float64Array(cellCount));
    let arrivalMass = 0;
    let passJoint = 0;

    for (let mask = 1; mask < maskCount; mask += 1) {
      for (let c = 0; c <= n; c += 1) {
        const mass = F[cell(mask, c)];
        const aAllMass = AAll[cell(mask, c)];
        const aMember = new Array<number>(m);
        let anyA = false;
        for (let i = 0; i < m; i += 1) {
          aMember[i] = A[i][cell(mask, c)];
          if (aMember[i] !== 0) anyA = true;
        }
        if (mass === 0 && aAllMass === 0 && !anyA) continue;

        const p = passOf(k, mask);
        arrivalMass += mass;
        passJoint += mass * p;

        // Enumerate dead subsets D ⊆ mask.
        let dead = mask;
        for (;;) {
          const surv = mask & ~dead;
          let transProb = 1;
          // Path weight for "no injury event anywhere": dead members contribute
          // their death factor (a death roll implies no injury), survivors must
          // have rolled fine, i.e. (1 − d − w) instead of (1 − d).
          let unscathedAll = 1;
          for (let i = 0; i < m; i += 1) {
            const bit = 1 << i;
            if (!(mask & bit)) continue;
            const r = riskOf(k, mask, i);
            if (dead & bit) {
              transProb *= r.death;
              unscathedAll *= r.death;
            } else {
              transProb *= 1 - r.death;
              unscathedAll *= 1 - r.death - r.injury;
            }
          }

          if (surv === 0) {
            // Wipe: absorbing for F, but a dead member rolls no injury — the
            // injury-free share of the wipe mass still counts for anyInjury.
            wipeNoInjuryMass += aAllMass * unscathedAll;
          } else if (transProb > 0) {
            nextF[cell(surv, c)] += mass * transProb * (1 - p);
            nextF[cell(surv, c + 1)] += mass * transProb * p;
            nextAAll[cell(surv, c)] += aAllMass * unscathedAll * (1 - p);
            nextAAll[cell(surv, c + 1)] += aAllMass * unscathedAll * p;
            for (let i = 0; i < m; i += 1) {
              if (!(surv & (1 << i))) continue;
              const r = riskOf(k, mask, i);
              const surviveProb = 1 - r.death;
              // i's factor becomes "unscathed" instead of merely "survived".
              const unscathedProb =
                surviveProb > 0 ? (transProb / surviveProb) * (1 - r.death - r.injury) : 0;
              nextA[i][cell(surv, c)] += aMember[i] * unscathedProb * (1 - p);
              nextA[i][cell(surv, c + 1)] += aMember[i] * unscathedProb * p;
            }
          }
          if (dead === 0) break;
          dead = (dead - 1) & mask;
        }
      }
    }

    // Checkpoint outputs: classify states reached after this phase, conditional
    // on surviving it (mass at start of k+1 = survived phase k).
    const retreat = emptyTiers();
    let surviveMass = 0;
    for (let mask = 1; mask < maskCount; mask += 1) {
      for (let c = 0; c <= n; c += 1) {
        const mass = nextF[cell(mask, c)];
        if (mass === 0) continue;
        surviveMass += mass;
        retreat[classifyTier(c, k + 1, mask !== fullMask)] += mass;
      }
    }
    if (surviveMass > 0) {
      TIERS.forEach((t) => {
        retreat[t] /= surviveMass;
      });
    }

    phaseOut.push({
      phaseId: phases[k].phaseId,
      passChance: round6(arrivalMass > 0 ? passJoint / arrivalMass : 0),
      surviveThrough: round6(surviveMass),
      retreatTiers: roundTiers(retreat),
    });

    F = nextF;
    AAll = nextAAll;
    A = nextA;
  }

  // ---- terminal aggregation ----
  const tiers = emptyTiers();
  const memberAlive = new Array<number>(m).fill(0);
  const memberUnscathed = new Array<number>(m).fill(0);
  let noInjuryMass = 0;
  let noDeathMass = 0;

  for (let mask = 1; mask < maskCount; mask += 1) {
    for (let c = 0; c <= n; c += 1) {
      const mass = F[cell(mask, c)];
      if (mass === 0 && AAll[cell(mask, c)] === 0) continue;
      const anyDeath = mask !== fullMask;
      tiers[classifyTier(c, n, anyDeath)] += mass;
      noInjuryMass += AAll[cell(mask, c)];
      if (mask === fullMask) noDeathMass += mass;
      for (let i = 0; i < m; i += 1) {
        if (mask & (1 << i)) {
          memberAlive[i] += mass;
          memberUnscathed[i] += A[i][cell(mask, c)];
        }
      }
    }
  }
  // Wipe mass never reaches the terminal loop (surv===0 is absorbing), so the
  // unaccounted probability is exactly the wipe probability → forced deadly.
  tiers.deadly += 1 - TIERS.reduce((acc, t) => acc + tiers[t], 0);

  const memberOut = members.map((member, i) => {
    const dead = 1 - memberAlive[i];
    const injured = Math.max(0, memberAlive[i] - memberUnscathed[i]);
    return {
      residentId: member.residentId,
      deathChance: round6(dead),
      injuryChance: round6(injured),
      unscathedChance: round6(Math.max(0, 1 - dead - injured)),
    };
  });

  const rewardMultipliers = input.rewardMultipliers ?? {};
  const itemEffects = input.itemEffects ?? [];
  const itemRewardDelta = itemEffects.reduce((acc, it) => acc + (it.rewardMultiplierDelta ?? 0), 0);
  const expectedRewardMultiplier =
    TIERS.reduce((acc, t) => acc + tiers[t] * (rewardMultipliers[t] ?? 1), 0) +
    sumDelta(consumables, 'rewardMultiplierDelta') +
    itemRewardDelta;

  const rawDuration =
    phases.reduce((acc, p) => acc + p.durationUnits, 0) +
    sumDelta(consumables, 'durationDelta') +
    itemEffects.reduce((acc, it) => acc + (it.durationDelta ?? 0), 0);
  const durationMult =
    consumables.reduce((acc, it) => acc * (it.durationMult ?? 1), 1) *
    itemEffects.reduce((acc, it) => acc * (it.durationMult ?? 1), 1);
  const duration = Math.max(input.durationMin ?? 1, Math.round(rawDuration * durationMult));

  return {
    questSuccess: round6(tiers.perfect + tiers.success),
    tiers: roundTiers(tiers),
    phases: phaseOut,
    members: memberOut,
    aggregate: {
      anyDeath: round6(1 - noDeathMass),
      anyInjury: round6(Math.max(0, 1 - noInjuryMass - wipeNoInjuryMass)),
      expectedDeaths: round6(members.reduce((acc, _mm, i) => acc + (1 - memberAlive[i]), 0)),
      expectedInjuries: round6(
        members.reduce(
          (acc, _mm, i) => acc + Math.max(0, memberAlive[i] - memberUnscathed[i]),
          0,
        ),
      ),
    },
    duration,
    expectedRewardMultiplier: round6(Math.max(0, expectedRewardMultiplier)),
    contributions: collectContributions(input, config),
  };
}

// ---------------------------------------------------------------------------
// WHY contributions (math spec §3.4 ordering)
// ---------------------------------------------------------------------------

function collectContributions(
  input: MissionPlannerInput,
  config: QuestSkillCheckConfig,
): MissionContribution[] {
  const { members, phases } = input;
  const mult = input.partyStatMult ?? 1;
  const consumables = input.consumables ?? [];
  const fullMask = (1 << members.length) - 1;
  const list: MissionContribution[] = [];

  if (members.length === 0) return list;

  // Success contributions: weakest-tag stat per member on the full-party set.
  phases.forEach((phase) => {
    const { tag } = phaseWeakestStat(members, fullMask, phase, mult, config);
    if (!tag) return;
    members.forEach((member) => {
      const v = member.stats[tag];
      if (typeof v === 'number' && Number.isFinite(v) && v !== 0) {
        list.push({
          metric: 'success',
          source: 'stat',
          sourceId: `${phase.phaseId}:${tag}`,
          delta: round6(v * mult),
          residentId: member.residentId,
        });
      }
    });
  });

  // Risk contributions on the full-party (entry) state.
  phases.forEach((phase) => {
    members.forEach((member, i) => {
      const push = (
        metric: 'injury' | 'death',
        source: MissionContribution['source'],
        sourceId: string,
        delta: number,
        providerId?: string,
      ) => {
        if (delta !== 0) {
          list.push({
            metric,
            source,
            sourceId,
            delta: round6(delta),
            residentId: member.residentId,
            providerId,
          });
        }
      };
      push('death', 'phase', phase.phaseId, phase.baseDeathChance);
      push('injury', 'phase', phase.phaseId, phase.baseInjuryChance);
      push('death', 'slot', `slot-${member.slotIndex}`, member.deathChanceDelta ?? 0);
      push('injury', 'slot', `slot-${member.slotIndex}`, member.injuryChanceDelta ?? 0);
      push('death', 'emptyPenalty', 'emptySlots', input.emptySlotPenalty?.deathChanceDelta ?? 0);
      push('injury', 'emptyPenalty', 'emptySlots', input.emptySlotPenalty?.injuryChanceDelta ?? 0);
      members.forEach((provider, j) => {
        if (j === i) return;
        push('death', 'cover', phase.phaseId, provider.coverDeathChanceDelta ?? 0, provider.residentId);
        push('injury', 'cover', phase.phaseId, provider.coverInjuryChanceDelta ?? 0, provider.residentId);
      });
      consumables.forEach((item) => {
        push('death', 'consumable', `${phase.phaseId}:${item.itemId}`, item.deathChanceDelta ?? 0);
        push('injury', 'consumable', `${phase.phaseId}:${item.itemId}`, item.injuryChanceDelta ?? 0);
      });
    });
  });

  // Duration/reward effects.
  (input.itemEffects ?? []).forEach((item) => {
    if (item.durationDelta) {
      list.push({
        metric: 'duration',
        source: 'equipment',
        sourceId: item.itemId,
        delta: item.durationDelta,
      });
    }
    if (item.durationMult && item.durationMult !== 1) {
      list.push({
        metric: 'duration',
        source: 'equipment',
        sourceId: item.itemId,
        delta: item.durationMult,
      });
    }
    if (item.rewardMultiplierDelta) {
      list.push({
        metric: 'reward',
        source: 'equipment',
        sourceId: item.itemId,
        delta: item.rewardMultiplierDelta,
      });
    }
  });
  consumables.forEach((item) => {
    if (item.durationDelta) {
      list.push({
        metric: 'duration',
        source: 'consumable',
        sourceId: item.itemId,
        delta: item.durationDelta,
      });
    }
    if (item.durationMult && item.durationMult !== 1) {
      list.push({
        metric: 'duration',
        source: 'consumable',
        sourceId: item.itemId,
        delta: item.durationMult,
      });
    }
    if (item.rewardMultiplierDelta) {
      list.push({
        metric: 'reward',
        source: 'consumable',
        sourceId: item.itemId,
        delta: item.rewardMultiplierDelta,
      });
    }
  });

  // Canonical WHY order: (metric, source, sourceId, member, provider).
  const metricOrder: MissionContribution['metric'][] = [
    'success',
    'injury',
    'death',
    'duration',
    'reward',
  ];
  list.sort((a, b) => {
    const byMetric = metricOrder.indexOf(a.metric) - metricOrder.indexOf(b.metric);
    if (byMetric !== 0) return byMetric;
    const bySource = a.source.localeCompare(b.source);
    if (bySource !== 0) return bySource;
    const byId = a.sourceId.localeCompare(b.sourceId);
    if (byId !== 0) return byId;
    const byResident = (a.residentId ?? '').localeCompare(b.residentId ?? '');
    if (byResident !== 0) return byResident;
    return (a.providerId ?? '').localeCompare(b.providerId ?? '');
  });

  return list;
}
