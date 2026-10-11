/**
 * Unit tests for the second compiled imprint instance (R-159):
 * «Il relitto sulla secca» — IMPR-002 «Il compagno che ride» × kit mare,
 * `gen-impr002-mare`.
 *
 * The point of a second instance is proving the imprint contributes a real
 * skeleton, not a reskin: same B0–B6 structure as `gen-impr002-palude`,
 * different mechanics. These tests pin the domain deltas:
 * - B0 alone-path flags 'annusati' on failure (a lone sail names itself —
 *   palude's walkway fail cost HP only);
 * - B2 the registry channel produces `polizza-ombra` — documentary
 *   evidence that ALSO gates the strongest B6 branch (`ma-sgama`);
 * - B5 `traccia-maestro` seeds the recovery-master shadow entity;
 * - B6 'a-sgamato' → evidence convoy → reward + the two-stakeholder seed.
 */

import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  availableOptions,
  createRun,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { createScenarioInstance as createInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import { GENERATED_CATALOG, IMPR002_MARE_SCENARIO } from '@/balancing/config/idleVillage/quests/generation/catalog';

const SCENARIO = IMPR002_MARE_SCENARIO;

function member(id: string, role: LabMember['role'], stats?: Partial<LabMember['stats']>, traits?: string[]): LabMember {
  return {
    id,
    name: id,
    role,
    stats: { perc: 70, int: 70, str: 65, con: 65, agi: 60, cha: 60, ...stats },
    hp: 100,
    ...(traits ? { traits } : {}),
  };
}

function party(traits?: string[]): LabMember[] {
  return [
    member('m-lead', 'leader', { perc: 80, int: 70 }, traits),
    member('m-fighter', 'member', { str: 80, con: 70 }),
    member('m-fixer', 'member', { cha: 75, int: 75 }),
    member('m-bg', 'bodyguard', { con: 80, str: 60, agi: 55 }),
  ];
}

function genRun(seed: number, traits?: string[]): QuestRunState {
  return createRun({
    party: party(traits),
    seed,
    questId: 'gen',
    scenarioInstance: createInstance(SCENARIO, { dangerScale: 1, rewardScale: 1 }, 'gen'),
  });
}

function driveToEnd(run: QuestRunState, pick: (s: QuestRunState) => string | undefined, maxSteps = 60): QuestRunState {
  for (let i = 0; i < maxSteps && !run.ended; i += 1) {
    const opts = availableOptions(run);
    if (!opts.length) break;
    const chosen = pick(run);
    applyChoice(run, chosen && opts.some((o) => o.id === chosen) ? chosen : opts[0]!.id);
  }
  return run;
}

const opt = (s: QuestRunState, id: string) => availableOptions(s).find((o) => o.id === id)?.id;

describe('imprint mare — schema, catalog, spine parity', () => {
  it('parses at import and registers in GENERATED_CATALOG', () => {
    expect(SCENARIO.id).toBe('gen-impr002-mare');
    expect(SCENARIO.startNode).toBe('ma-partenza');
    expect(GENERATED_CATALOG['gen-impr002-mare']).toBe(SCENARIO);
  });

  it('shares the spine vocabulary with palude: sospetto var, same turn router semantics', () => {
    const run = genRun(1);
    expect(run.vars).toEqual({ sospetto: 0 });
    expect(run.nodeId).toBe('ma-partenza');
    // Same skeleton: fork at B0, cracks hub at B2, router at B3, fork at B4.
    for (const id of ['ma-segnali', 'ma-schieramento', 'ma-scelta', 'ma-stiva']) {
      expect(SCENARIO.nodes[id], id).toBeDefined();
    }
  });
});

describe('imprint mare — domain deltas (not a reskin)', () => {
  it('a failed lone-sail approach flags annusati — exposure, not just damage', () => {
    let saw = false;
    for (let seed = 1; seed <= 60 && !saw; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'ma-rifiuta');
      expect(run.flags).toContain('rotta-propria');
      if (run.flags.includes('annusati')) {
        saw = true;
        // Spotted on the water: the turn will route to the heavy ambush.
        applyChoice(run, 'ma-lascia');
        expect(run.visitedNodes).toContain('ma-imboscata');
      }
    }
    expect(saw, 'rotta propria mai avvistata su 60 seed').toBe(true);
  });

  it('the registry yields polizza-ombra on a good read — evidence, not a warning', () => {
    let saw = false;
    for (let seed = 1; seed <= 40 && !saw; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'ma-accetta');
      expect(run.nodeId).toBe('ma-segnali');
      applyChoice(run, 'ma-registro');
      expect(run.nodeId).toBe('ma-segnali');
      expect(availableOptions(run).map((o) => o.id)).not.toContain('ma-registro');
      if (run.info.includes('polizza-ombra')) {
        saw = true;
        expect(run.vars?.sospetto ?? 0).toBeGreaterThan(0);
      }
    }
    expect(saw, 'polizza-ombra mai ottenuta su 40 seed').toBe(true);
  });

  it('the widow’s warning lands for everyone — evidence arrives after leaving', () => {
    const run = genRun(1);
    applyChoice(run, 'ma-accetta');
    applyChoice(run, 'ma-lascia');
    expect(run.visitedNodes).toContain('ma-avviso');
    expect(run.visitedNodes).toContain('ma-schieramento');
    expect(run.nodeId).toBe('ma-scelta');
  });

  it('the sgama option exists only with polizza-ombra in hand', () => {
    const node = SCENARIO.nodes['ma-in-piedi']!;
    const sgama = (node.options ?? []).find((o) => o.id === 'ma-sgama');
    expect(sgama?.requiresInfo).toBe('polizza-ombra');
    // And the evidence path is the only route to ma-consegna.
    const stiva = SCENARIO.nodes['ma-stiva']!;
    const gotoSpec = stiva.verdictTable!.win!.goto;
    expect(gotoSpec).toBeTypeOf('object');
    const branches = (gotoSpec as { branches: { when: { flag?: string }; then: string }[] }).branches;
    expect(branches.some((b) => b.when.flag === 'a-sgamato' && b.then === 'ma-consegna')).toBe(true);
  });
});

describe('imprint mare — B5 irony and B6 fork', () => {
  it('prisoner path: posta-mossa + a delivered shipowner → reward, traccia seed on good reads', () => {
    let sawReward = false;
    let sawTraccia = false;
    for (let seed = 1; seed <= 80 && !(sawReward && sawTraccia); seed += 1) {
      const run = driveToEnd(genRun(seed), (s) =>
        opt(s, 'ma-accetta') ?? opt(s, 'ma-lascia') ?? opt(s, 'ma-via-forza') ??
        opt(s, 'fight-turn') ?? opt(s, 'ma-lega'),
      );
      if (run.outcome === 'reward' && run.flags.includes('a-consegnato')) {
        sawReward = true;
        expect(run.flags).toContain('posta-mossa');
        if (run.info.includes('traccia-maestro')) sawTraccia = true;
      }
    }
    expect(sawReward, 'mai reward a-consegnato su 80 seed').toBe(true);
    expect(sawTraccia, 'traccia-maestro mai letta su 80 seed').toBe(true);
  });

  it('the evidence ending: registry → fight → sgama → consegna → a-consegnato + traccia-maestro', () => {
    let saw = false;
    for (let seed = 1; seed <= 120 && !saw; seed += 1) {
      const run = driveToEnd(genRun(seed), (s) =>
        opt(s, 'ma-accetta') ?? opt(s, 'ma-registro') ?? opt(s, 'ma-lascia') ??
        opt(s, 'ma-via-forza') ?? opt(s, 'fight-turn') ?? opt(s, 'ma-sgama') ?? opt(s, 'ma-lega'),
      );
      if (run.outcome === 'reward' && run.flags.includes('a-sgamato') && run.flags.includes('a-consegnato')) {
        saw = true;
        expect(run.info).toContain('traccia-maestro');
      }
    }
    expect(saw, 'mai reward via sgamato su 120 seed').toBe(true);
  });

  it('flight keeps him master of the water — survived, a-padrone', () => {
    const run = driveToEnd(genRun(1), (s) =>
      opt(s, 'ma-accetta') ?? opt(s, 'ma-lascia') ?? opt(s, 'ma-via-fuga'),
    );
    expect(run.ended).toBe(true);
    expect(run.flags).toContain('a-padrone');
    expect(run.outcome).toBe('survived');
  });
});
