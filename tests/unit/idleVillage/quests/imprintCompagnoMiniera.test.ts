/**
 * Unit tests for the third compiled imprint instance (R-163):
 * «La squadra del caposquadra» — IMPR-002 «Il compagno che ride» × kit
 * miniera, `gen-impr002-miniera`.
 *
 * Third instance = the spine stops being a hypothesis. These tests pin the
 * miniera domain deltas (mechanical, not copy):
 * - B0 waste-gallery descent flags 'annusati' on failure — underground,
 *   evidence is SOUND: a rockfall announces you (stats con+int — reading
 *   rotten timber and bad air is knowledge);
 * - B2 the shift register yields `turni-ombra` — shadow shifts signed by a
 *   dead man: proof of the parallel extraction AND a chill;
 * - B4 adds `mi-via-puntelli` — bring the roof down: first authored
 *   environmental-hazard combat alternative (win bypasses the fight,
 *   almost becomes your ambush, fail means fighting hurt);
 * - B5 the mover is NOT human: `traccia-morso` seeds the IMPR-001-C
 *   entity (cross-imprint bridge);
 * - B6 'a-sgamato' delivers foreman + register to the company's factor.
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
import { GENERATED_CATALOG, IMPR002_MINIERA_SCENARIO } from '@/balancing/config/idleVillage/quests/generation/catalog';

const SCENARIO = IMPR002_MINIERA_SCENARIO;

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

describe('imprint miniera — schema, catalog, spine parity', () => {
  it('parses at import and registers in GENERATED_CATALOG', () => {
    expect(SCENARIO.id).toBe('gen-impr002-miniera');
    expect(SCENARIO.startNode).toBe('mi-partenza');
    expect(GENERATED_CATALOG['gen-impr002-miniera']).toBe(SCENARIO);
  });

  it('shares the spine vocabulary: sospetto var, turn router, fork nodes', () => {
    const run = genRun(1);
    expect(run.vars).toEqual({ sospetto: 0 });
    for (const id of ['mi-segnali', 'mi-schieramento', 'mi-scelta', 'mi-vena']) {
      expect(SCENARIO.nodes[id], id).toBeDefined();
    }
    // Same router semantics: pronti / sospetto>=2 / annusati / else.
    const router = SCENARIO.nodes['mi-schieramento']!.verdictTable!.win!.goto as {
      branches: { when: Record<string, unknown>; then: string }[];
      else: string;
    };
    expect(router.branches[0]!.then).toBe('mi-disposti');
    expect(router.branches[2]!.then).toBe('mi-imboscata');
    expect(router.else).toBe('mi-trappola');
  });
});

describe('imprint miniera — domain deltas (not a reskin)', () => {
  it('a failed waste-gallery descent flags annusati — the rock carries a stumble further than a shout', () => {
    let saw = false;
    for (let seed = 1; seed <= 60 && !saw; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'mi-rifiuta');
      expect(run.flags).toContain('rotta-propria');
      if (run.flags.includes('annusati')) {
        saw = true;
        applyChoice(run, 'mi-lascia');
        expect(run.visitedNodes).toContain('mi-imboscata');
      }
    }
    expect(saw, 'discesa mai sentita su 60 seed').toBe(true);
  });

  it('the shift register yields turni-ombra on a good read — proof and chill in one intel', () => {
    let saw = false;
    for (let seed = 1; seed <= 40 && !saw; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'mi-accetta');
      applyChoice(run, 'mi-registro');
      expect(availableOptions(run).map((o) => o.id)).not.toContain('mi-registro');
      if (run.info.includes('turni-ombra')) {
        saw = true;
        expect(run.vars?.sospetto ?? 0).toBeGreaterThan(0);
      }
    }
    expect(saw, 'turni-ombra mai ottenuta su 40 seed').toBe(true);
  });

  it('the cage-boy’s warning lands for everyone', () => {
    const run = genRun(1);
    applyChoice(run, 'mi-accetta');
    applyChoice(run, 'mi-lascia');
    expect(run.visitedNodes).toContain('mi-avviso');
    expect(run.visitedNodes).toContain('mi-schieramento');
    expect(run.nodeId).toBe('mi-scelta');
  });

  it('sgama is gated on turni-ombra — the register is the evidence', () => {
    const node = SCENARIO.nodes['mi-in-piedi']!;
    const sgama = (node.options ?? []).find((o) => o.id === 'mi-sgama');
    expect(sgama?.requiresInfo).toBe('turni-ombra');
  });
});

describe('imprint miniera — the puntelli play (environmental hazard as combat alternative)', () => {
  it('the option exists at B4 and routes three ways in the verdictTable', () => {
    const node = SCENARIO.nodes['mi-scelta']!;
    const puntelli = (node.options ?? []).find((o) => o.id === 'mi-via-puntelli');
    expect(puntelli?.next).toBe('CHECK:mi-puntelli');
    const vt = SCENARIO.nodes['mi-puntelli']!.verdictTable!;
    // Win: the rock does the fighting — no combat node.
    expect(vt.win!.goto).toBe('mi-in-piedi');
    expect(vt.bigwin!.goto).toBe('mi-in-piedi');
    expect(vt.bigwin!.setFlags).toContain('galleria-crollata');
    // Almost: partial collapse becomes your ambush.
    expect(vt.almost!.goto).toBe('mi-scontro-sorpresa');
    // Fail: you fight hurt on his ground.
    expect(vt.fail!.goto).toBe('mi-scontro');
  });

  it('a successful puntelli run reaches the foreman without any combat node', () => {
    let saw = false;
    for (let seed = 1; seed <= 120 && !saw; seed += 1) {
      const run = genRun(seed);
      applyChoice(run, 'mi-accetta');
      applyChoice(run, 'mi-lascia');
      applyChoice(run, 'mi-via-puntelli');
      if (run.nodeId === 'mi-in-piedi' && run.flags.includes('galleria-crollata')) {
        saw = true;
        expect(run.visitedNodes).not.toContain('mi-scontro');
        expect(run.visitedNodes).not.toContain('mi-scontro-sorpresa');
      }
    }
    expect(saw, 'puntelli mai riuscito pulito su 120 seed').toBe(true);
  });
});

describe('imprint miniera — B5 irony and B6 fork', () => {
  it('the vein was bitten: posta-mossa on every read, traccia-morso seeds the thing below', () => {
    let sawReward = false;
    let sawTraccia = false;
    for (let seed = 1; seed <= 80 && !(sawReward && sawTraccia); seed += 1) {
      const run = driveToEnd(genRun(seed), (s) =>
        opt(s, 'mi-accetta') ?? opt(s, 'mi-lascia') ?? opt(s, 'mi-via-forza') ??
        opt(s, 'fight-turn') ?? opt(s, 'mi-lega'),
      );
      if (run.outcome === 'reward' && run.flags.includes('a-consegnato')) {
        sawReward = true;
        expect(run.flags).toContain('posta-mossa');
        if (run.info.includes('traccia-morso')) sawTraccia = true;
      }
    }
    expect(sawReward, 'mai reward a-consegnato su 80 seed').toBe(true);
    expect(sawTraccia, 'traccia-morso mai letta su 80 seed').toBe(true);
  });

  it('the evidence ending: register → fight → sgama → consegna → a-consegnato + traccia-morso', () => {
    let saw = false;
    for (let seed = 1; seed <= 120 && !saw; seed += 1) {
      const run = driveToEnd(genRun(seed), (s) =>
        opt(s, 'mi-accetta') ?? opt(s, 'mi-registro') ?? opt(s, 'mi-lascia') ??
        opt(s, 'mi-via-forza') ?? opt(s, 'fight-turn') ?? opt(s, 'mi-sgama') ?? opt(s, 'mi-lega'),
      );
      if (run.outcome === 'reward' && run.flags.includes('a-sgamato') && run.flags.includes('a-consegnato')) {
        saw = true;
        expect(run.info).toContain('traccia-morso');
      }
    }
    expect(saw, 'mai reward via sgamato su 120 seed').toBe(true);
  });

  it('the long ascent keeps him master of the deep — survived, a-padrone', () => {
    const run = driveToEnd(genRun(1), (s) =>
      opt(s, 'mi-accetta') ?? opt(s, 'mi-lascia') ?? opt(s, 'mi-via-fuga'),
    );
    expect(run.ended).toBe(true);
    expect(run.flags).toContain('a-padrone');
    expect(run.outcome).toBe('survived');
  });
});
