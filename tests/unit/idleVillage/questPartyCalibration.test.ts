/**
 * PLAN-019-S2.2 T-4 — per-check calibration diagnostic (two-level).
 *
 * For every `check` node of both scenarios the test measures the EXACT
 * analytic forecast (`analyzeCheck`) twice:
 *   - reference: the scenario's authored `offer.referenceParty` (the lab
 *     stats the scenario was tuned on);
 *   - observed:  the real-resident calibration party — the residents named in
 *     `QUEST_MEMBER_STATS.calibrationResidents`, converted through
 *     `savedCharacterToResident` → `residentToQuestMember`.
 *
 * Per check it records scenario, stat channel, reference vs observed
 * success%, anyDeath/anyWound deltas and the per-member death distribution.
 * The report is written to `test-results/s22-calibration-<date>.log`.
 *
 * This is level (a) — DIAGNOSTIC. No band assertion: the plan reserves the
 * acceptance gate (b) for Director review of the scostamenti (allowed
 * outcomes: re-approve the scale, move the band into versioned config, or
 * accept+record).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { savedCharacterToResident } from '@/engine/game/idleVillage/characterImport';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
import { QUEST_MEMBER_STATS } from '@/balancing/config/idleVillage/quests/questMemberStats';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import { analyzeCheck } from '@/ui/idleVillage/questS1Lab/questSimulation';
import { createRun, type QuestId, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';

const SCENARIOS: { questId: QuestId; scenario: QuestScenario }[] = [
  { questId: 'goblin', scenario: GOBLIN_SCENARIO },
  { questId: 'rovine', scenario: ROVINE_SCENARIO },
];

/** Real-resident calibration party from the config-named residents. */
function realCalibrationParty(): LabMember[] {
  return QUEST_MEMBER_STATS.calibrationResidents.map(({ residentId, role }) => {
    const hero = TEST_ROSTER_HEROES.find((h) => h.id === residentId);
    if (!hero) throw new Error(`calibration resident ${residentId} non nel roster canonico`);
    return residentToQuestMember(savedCharacterToResident(hero), role);
  });
}

/** Run state whose party is `members`, positioned at `nodeId`, no bag flags
 *  and consumables disarmed — the check reads party strength only. */
function stateAt(questId: QuestId, nodeId: string, members: LabMember[]): QuestRunState {
  const run = createRun({ party: { members }, seed: 1, questId });
  run.nodeId = nodeId;
  run.flags = [];
  return run;
}

interface Row {
  questId: QuestId;
  nodeId: string;
  stats: string;
  refSuccess: number;
  realSuccess: number;
  dSuccess: number;
  refDeath: number;
  realDeath: number;
  dDeath: number;
  deaths: string;
}

describe('per-check calibration — reference vs real residents (T-4)', () => {
  const rows: Row[] = [];

  it('produces the diagnostic report', () => {
    const real = realCalibrationParty();
    for (const { questId, scenario } of SCENARIOS) {
      const refMembers: LabMember[] = (scenario.offer.referenceParty ?? []).map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        role: m.role,
        hp: m.hp,
        stats: m.stats as LabMember['stats'],
      }));
      expect(refMembers.length).toBeGreaterThan(0);
      for (const node of Object.values(scenario.nodes)) {
        if (node.kind !== 'check') continue;
        const ref = analyzeCheck(stateAt(questId, node.id, refMembers), node, { useConsumable: false });
        const obs = analyzeCheck(stateAt(questId, node.id, real), node, { useConsumable: false });
        rows.push({
          questId,
          nodeId: node.id,
          stats: (node.stats ?? []).join('+'),
          refSuccess: ref.successPct,
          realSuccess: obs.successPct,
          dSuccess: +(obs.successPct - ref.successPct).toFixed(1),
          refDeath: ref.anyDeathPct,
          realDeath: obs.anyDeathPct,
          dDeath: +(obs.anyDeathPct - ref.anyDeathPct).toFixed(1),
          deaths: obs.perMember.map((m) => `${m.name}:${m.deathPct.toFixed(0)}%`).join(' '),
        });
      }
    }

    const header = [
      'S2.2 T-4 — calibrazione per-check: party di riferimento (lab) vs residenti reali',
      `party reale: ${real.map((m) => `${m.name} {${Object.entries(m.stats).map(([s, v]) => `${s}${v}`).join(' ')}} hp:${m.hp}`).join(' | ')}`,
      '',
      `${'quest'.padEnd(7)} ${'check'.padEnd(22)} ${'stats'.padEnd(9)} ${'ref%'.padStart(5)} ${'real%'.padStart(6)} ${'Δsucc'.padStart(6)} ${'refD%'.padStart(6)} ${'realD%'.padStart(7)} ${'Δdeath'.padStart(7)}  morti/membre`,
      '-'.repeat(105),
      ...rows.map(
        (r) =>
          `${r.questId.padEnd(7)} ${r.nodeId.padEnd(22)} ${r.stats.padEnd(9)} ${r.refSuccess.toFixed(0).padStart(5)} ${r.realSuccess.toFixed(0).padStart(6)} ${r.dSuccess.toFixed(1).padStart(6)} ${r.refDeath.toFixed(0).padStart(6)} ${r.realDeath.toFixed(0).padStart(7)} ${r.dDeath.toFixed(1).padStart(7)}  ${r.deaths}`,
      ),
      '',
      'Gate (b): gli scostamenti sopra vanno classificati dal Director — scala ri-approvata,',
      'banda spostata in config versionata, oppure accettato+registrato. Un finding ≠ chiuso.',
    ].join('\n');

    const dir = join(process.cwd(), 'test-results');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 's22-calibration-2026-10-09.log');
    writeFileSync(file, header + '\n');
    process.stdout.write(`\n${header}\n`);

    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(Number.isFinite(r.realSuccess)).toBe(true);
      expect(Number.isFinite(r.realDeath)).toBe(true);
    }
  });

  it('every check stat channel is covered by the mock-or-real contract (mockChannel list)', () => {
    /* Acceptance #4: enumerate which check channels read declared mocks. */
    const mockStats = new Set(
      Object.entries(QUEST_MEMBER_STATS.channels)
        .filter(([, ch]) => 'mockChannel' in ch && ch.mockChannel)
        .map(([s]) => s),
    );
    for (const { scenario } of SCENARIOS) {
      for (const node of Object.values(scenario.nodes)) {
        if (node.kind !== 'check') continue;
        for (const s of node.stats ?? []) {
          if (mockStats.has(s)) {
            // declared derogation — listed, never silently real
            expect(['int', 'cha']).toContain(s);
          }
        }
      }
    }
  });
});
