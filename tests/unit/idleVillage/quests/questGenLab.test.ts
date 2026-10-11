/**
 * Tests for the Quest Generation Lab view-model (R-140).
 *
 * The lab is a lens over real data — these tests pin the derivation so a
 * catalog/registry drift breaks loudly instead of silently mis-describing
 * the system: gimmick/kit resolution per scenario, twist collection, the
 * DFS node tree, and an end-to-end drive of every catalog scenario on the
 * 'gen' engine profile.
 */

import { describe, expect, it } from 'vitest';
import {
  gimmickOf,
  imprintCatalogEntries,
  kitIdOf,
  labCatalogEntries,
  labKits,
  scenarioMechanicsUsed,
  scenarioTraitsUsed,
  scenarioTwists,
} from '@/ui/idleVillage/questGenLab/labModel';
import { scenarioTreeRows } from '@/ui/idleVillage/questGenLab/labGraph';
import {
  QUEST_LAB_CONSEQUENCES,
  QUEST_LAB_GIMMICKS,
  QUEST_LAB_MECHANICS,
  QUEST_LAB_OPEN,
  QUEST_LAB_PIPELINE,
  QUEST_LAB_REGISTRY,
  QUEST_LAB_SUBSYSTEMS,
  LAB_STATUS,
} from '@/balancing/config/idleVillage/quests/generation/labRegistry';
import { GENERATED_CATALOG } from '@/balancing/config/idleVillage/quests/generation/catalog';
import {
  applyChoice,
  availableOptions,
  createRun,
  nodesFor,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { createScenarioInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import { PARTY_PRESETS, type LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';

const ENTRIES = labCatalogEntries();

function genRun(scenarioId: string, seed: number, traits?: string[]): QuestRunState {
  const scenario = GENERATED_CATALOG[scenarioId];
  if (!scenario) throw new Error(`unknown scenario ${scenarioId}`);
  const members: LabMember[] = PARTY_PRESETS[0]!.members.map((m, i) =>
    traits && i === 0 ? { ...m, traits } : { ...m },
  );
  return createRun({
    party: { members },
    seed,
    questId: 'gen',
    scenarioInstance: createScenarioInstance(scenario, { dangerScale: 1, rewardScale: 1 }, 'gen'),
  });
}

describe('questGenLab — gimmick/kit derivation', () => {
  it('resolves the id segments', () => {
    expect(gimmickOf('gen-race-passo-montano')).toBe('race');
    expect(gimmickOf('gen-flood-miniera')).toBe('flood');
    expect(kitIdOf('gen-race-passo-montano')).toBe('passo-montano');
    expect(kitIdOf('gen-flood-mare')).toBe('mare');
    expect(gimmickOf('goblin')).toBeUndefined();
    /* R-152: imprint-compiled ids encode no gimmick — a different provenance. */
    expect(gimmickOf('gen-impr002-palude')).toBeUndefined();
  });

  it('every catalog scenario maps to a registered gimmick+kit or an imprint spine', () => {
    const kits = labKits();
    const imprint = imprintCatalogEntries();
    /* gimmick entries + imprint spines cover the whole catalog — no silent
     * third provenance class. */
    expect(ENTRIES.length + imprint.length).toBe(Object.keys(GENERATED_CATALOG).length);
    for (const e of ENTRIES) {
      expect(QUEST_LAB_GIMMICKS[e.gimmickId], e.scenario.id).toBeDefined();
      expect(e.kit, e.scenario.id).toBeDefined();
      expect(kits.find((k) => k.key === e.kit!.key)).toBeDefined();
    }
    for (const i of imprint) {
      expect(i.imprintId, i.scenario.id).toMatch(/^impr\d+/);
      expect(i.domainId, i.scenario.id).toBeTruthy();
    }
    expect(imprint.some((i) => i.scenario.id === 'gen-impr002-palude')).toBe(true);
  });

  it('kits report origin and link back to their scenarios', () => {
    const kits = labKits();
    expect(kits.filter((k) => k.origin === 'narrated').length).toBeGreaterThanOrEqual(2);
    for (const k of kits) {
      expect(k.scenarioIds.length, k.key).toBeGreaterThan(0);
      for (const id of k.scenarioIds) {
        expect(kitIdOf(id)).toBe(k.id);
        expect(gimmickOf(id)).toBe(k.gimmick);
      }
    }
  });
});

describe('questGenLab — scenario feature derivation', () => {
  it('collects runstart armRolls and in-run rollFlags', () => {
    const race = ENTRIES.find((e) => e.scenario.id === 'gen-race-passo-montano')!;
    const flags = scenarioTwists(race.scenario).map((t) => t.flag);
    expect(flags).toContain('inseguimento');
    const flood = ENTRIES.find((e) => e.gimmickId === 'flood')!;
    const floodTwists = scenarioTwists(flood.scenario);
    expect(floodTwists.some((t) => t.flag === 'cassa-madre' && t.kind === 'runstart')).toBe(true);
  });

  it('derives traits and mechanics used', () => {
    for (const e of ENTRIES) {
      expect(e.mechanicsUsed).toContain('verdict-table');
      expect(e.mechanicsUsed).toContain('vars');
      // every mechanic id must exist in the glossary
      for (const m of e.mechanicsUsed) {
        expect(
          QUEST_LAB_MECHANICS.some((x) => x.id === m),
          `${e.scenario.id} uses unknown mechanic '${m}'`,
        ).toBe(true);
      }
    }
    expect(scenarioTraitsUsed(GENERATED_CATALOG['gen-race-passo-montano'])).toContain('avido');
    expect(scenarioMechanicsUsed(GENERATED_CATALOG['gen-race-passo-montano'])).toContain('gates');
  });
});

describe('questGenLab — scenario tree', () => {
  it('roots at startNode and terminates on hub graphs', () => {
    for (const e of ENTRIES) {
      const rows = scenarioTreeRows(e.scenario);
      expect(rows.length, e.scenario.id).toBeGreaterThan(5);
      expect(rows[0]!.nodeId).toBe(e.scenario.startNode);
      // the flood hub loops back to the crossroads — repeated rows exist
      if (e.gimmickId === 'flood') {
        expect(rows.some((r) => r.repeated), e.scenario.id).toBe(true);
      }
    }
  });

  it('marks cycle stubs without expanding them twice', () => {
    const flood = GENERATED_CATALOG['gen-flood-miniera'];
    const rows = scenarioTreeRows(flood);
    const expanded = rows.filter((r) => !r.repeated).map((r) => r.nodeId);
    expect(new Set(expanded).size).toBe(expanded.length);
  });
});

describe('questGenLab — registry integrity', () => {
  it('self-parses and uses the closed status vocabulary', () => {
    expect(QUEST_LAB_REGISTRY.gimmicks.race.status).toBe('offline');
    for (const step of QUEST_LAB_PIPELINE) {
      expect(LAB_STATUS).toContain(step.status);
      expect(step.files.length).toBeGreaterThan(0);
    }
    expect(QUEST_LAB_SUBSYSTEMS.length).toBeGreaterThan(10);
    expect(QUEST_LAB_CONSEQUENCES.some((c) => c.status === 'missing')).toBe(true);
    expect(QUEST_LAB_OPEN.length).toBeGreaterThan(5);
  });
});

describe('questGenLab — e2e drive on the gen profile', () => {
  it('every catalog scenario starts a run on its own start node', () => {
    for (const e of ENTRIES) {
      const run = genRun(e.scenario.id, 1);
      expect(run.questId).toBe('gen');
      expect(run.nodeId).toBe(e.scenario.startNode);
      expect(nodesFor(run)[run.nodeId]?.id).toBe(e.scenario.startNode);
    }
  });

  it('a full drive ends every scenario with a terminal outcome', () => {
    for (const e of ENTRIES) {
      let ended = false;
      for (let seed = 1; seed <= 50 && !ended; seed += 1) {
        const run = genRun(e.scenario.id, seed);
        for (let i = 0; i < 60 && !run.ended; i += 1) {
          const opts = availableOptions(run).filter((o) => !o.disabled);
          if (!opts.length) break;
          applyChoice(run, opts[0]!.id);
        }
        if (run.ended) {
          ended = true;
          expect(run.outcome).not.toBe('running');
        }
      }
      expect(ended, `${e.scenario.id} never terminated`).toBe(true);
    }
  });
});
