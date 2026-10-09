/**
 * Unit tests for the generated catalog v0 (PLAN-026 T-3): the
 * gara-di-avanzamento skeleton × two domain kits — «La Corsa al Passo
 * del Corvo» (passo-montano) and «La Corsa alle Chiuse Vecchie» (palude).
 *
 * Proves the v2 engine executes generated catalog scenarios end-to-end:
 * schema parse at import, kit-swap (same skeleton, different world),
 * runstart armRolls trait-gating, vars racing to the goal, the
 * 'inseguimento' twist branch changing the route, trait/info-gated
 * options, and the TAKEN→SECURED→reward chain on the 'gen' profile.
 */

import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  availableOptions,
  createRun,
  nodesFor,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { createScenarioInstance as createInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import {
  GENERATED_CATALOG,
  RACE_TO_MARSH_SCENARIO,
  RACE_TO_PASS_SCENARIO,
  generateRaceScenario,
  PALUDE_KIT,
} from '@/balancing/config/idleVillage/quests/generation/catalog';
import { generateRaceToPass } from '@/balancing/config/idleVillage/quests/generation/raceToPass';

/** Only the gara-di-avanzamento entries of the catalog (excludes other gimmicks). */
const RACE_SCENARIOS = Object.values(GENERATED_CATALOG).filter((s) => s.id.startsWith('gen-race-'));

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function member(id: string, role: LabMember['role'], stats?: Partial<LabMember['stats']>, traits?: string[]): LabMember {
  return {
    id,
    name: id,
    role,
    stats: { perc: 60, int: 40, str: 60, con: 60, agi: 60, cha: 40, ...stats },
    hp: 100,
    ...(traits ? { traits } : {}),
  };
}

function party(traits?: string[]): LabMember[] {
  return [
    member('m-lead', 'leader', { agi: 80, perc: 65 }, traits),
    member('m-run', 'member', { str: 75, con: 70 }),
    member('m-scout', 'member', { perc: 75, int: 55 }),
    member('m-bg', 'bodyguard', { con: 80, str: 60 }),
  ];
}

/** Instance of a generated scenario at neutral scales, questId 'gen'. */
function genInstance(scenario: QuestScenario) {
  return createInstance(scenario, { dangerScale: 1, rewardScale: 1 }, 'gen');
}

function genRun(scenario: QuestScenario, seed: number, traits?: string[]): QuestRunState {
  return createRun({ party: party(traits), seed, questId: 'gen', scenarioInstance: genInstance(scenario) });
}

/** Drive the run to a terminal state picking a strategy; returns the run. */
function driveToEnd(
  run: QuestRunState,
  pick: (state: QuestRunState) => string,
  maxSteps = 40,
): QuestRunState {
  for (let i = 0; i < maxSteps && !run.ended; i += 1) {
    const opts = availableOptions(run).filter((o) => !o.disabled);
    if (!opts.length) break;
    const chosen = pick(run);
    if (!opts.some((o) => o.id === chosen)) applyChoice(run, opts[0]!.id);
    else applyChoice(run, chosen);
  }
  return run;
}

const opt = (s: QuestRunState, id: string) => availableOptions(s).find((o) => o.id === id)?.id;

/* ------------------------------------------------------------------ */
/* Schema + generator + catalog                                        */
/* ------------------------------------------------------------------ */

describe('generated catalog — schema and kit-swap', () => {
  it('both imprints parse against QuestScenarioSchema at import', () => {
    expect(RACE_TO_PASS_SCENARIO.id).toBe('gen-race-passo-montano');
    expect(RACE_TO_PASS_SCENARIO.startNode).toBe('rp-partenza');
    expect(RACE_TO_MARSH_SCENARIO.id).toBe('gen-race-palude');
    expect(RACE_TO_MARSH_SCENARIO.startNode).toBe('rm-partenza');
    expect(GENERATED_CATALOG['gen-race-palude']).toBe(RACE_TO_MARSH_SCENARIO);
  });

  it('generator is parametrized: goal and twistChance propagate', () => {
    const s = generateRaceToPass({ goal: 4, twistChance: 90 });
    expect(s.initialVars?.goal).toBe(4);
    expect(s.armRolls?.[0]?.chance).toBe(90);
    expect(s.scenarioVersion).toBe('gen-race-passo-montano-4-90');
  });

  it('kit-swap: same skeleton shape, different ids, names and intel', () => {
    const pass = RACE_TO_PASS_SCENARIO;
    const marsh = RACE_TO_MARSH_SCENARIO;
    expect(Object.keys(pass.nodes)).toHaveLength(Object.keys(marsh.nodes).length);
    // Same skeleton: strip the prefix and the graph is identical.
    const strip = (id: string) => id.replace(/^[a-z]+-/, '');
    const passIds = Object.keys(pass.nodes).map(strip).sort();
    const marshIds = Object.keys(marsh.nodes).map(strip).sort();
    expect(passIds).toEqual(marshIds);
    // Different world: the dressing changed.
    expect(pass.nodes['rp-viaB']?.title).not.toBe(marsh.nodes['rm-viaB']?.title);
    const marshInfo = marsh.nodes['rm-viaB']?.verdictTable?.win?.setInfo;
    expect(marshInfo).toEqual(['canale-morto']);
    // The twist flag/arming is structural — shared across kits.
    expect(marsh.armRolls?.[0]?.flag).toBe('inseguimento');
    expect(marsh.armRolls?.[0]?.requiresTrait).toBe('scavezzacollo');
    // Palude kit content respected (QUEST_IMPRINTS: passarelle, fango).
    expect(marsh.nodes['rm-viaA']?.body).toMatch(/tavol|passarell|canal/i);
  });

  it('a kit with a wrong skeleton key fails generation loudly', () => {
    const broken = { ...PALUDE_KIT, copy: { ...PALUDE_KIT.copy, tappa: undefined } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => generateRaceScenario(broken as any)).toThrow();
  });

  it('every check node carries a verdictTable (data-driven, no legacy path)', () => {
    for (const scenario of Object.values(GENERATED_CATALOG)) {
      const checks = Object.values(scenario.nodes).filter((n) => n.kind === 'check');
      expect(checks.length).toBeGreaterThanOrEqual(8);
      for (const c of checks) expect(c.verdictTable).toBeDefined();
    }
  });
});

/* ------------------------------------------------------------------ */
/* Run creation on the 'gen' profile                                   */
/* ------------------------------------------------------------------ */

describe('generated run — gen profile', () => {
  it('createRun on the instance seeds the race vars and starts on the kit node', () => {
    const pass = genRun(RACE_TO_PASS_SCENARIO, 1);
    expect(pass.questId).toBe('gen');
    expect(pass.nodeId).toBe('rp-partenza');
    expect(pass.vars).toEqual({ you: 0, rival: 0, goal: 6 });
    expect(nodesFor(pass)).toBe(genInstance(RACE_TO_PASS_SCENARIO).nodes);
    const marsh = genRun(RACE_TO_MARSH_SCENARIO, 1);
    expect(marsh.nodeId).toBe('rm-partenza');
  });

  it("questId 'gen' without an instance throws — no empty authored map", () => {
    expect(() =>
      createRun({ party: party(), seed: 1, questId: 'gen' }),
    ).toThrow(/gen.*ScenarioInstance/);
  });

  it('the Scavezzacollo armRoll gates the twist arming (both kits)', () => {
    const scenarios = [
      generateRaceToPass({ twistChance: 100 }),
      generateRaceScenario(PALUDE_KIT, { twistChance: 100 }),
    ];
    for (const scenario of scenarios) {
      const instance = genInstance(scenario);
      const reckless = createRun({
        party: party(['scavezzacollo']),
        seed: 1,
        questId: 'gen',
        scenarioInstance: instance,
      });
      expect(reckless.flags, scenario.id).toContain('inseguimento');
      const prudent = createRun({
        party: party(),
        seed: 1,
        questId: 'gen',
        scenarioInstance: instance,
      });
      expect(prudent.flags, scenario.id).not.toContain('inseguimento');
    }
  });
});

/* ------------------------------------------------------------------ */
/* Options gating — info and traits                                    */
/* ------------------------------------------------------------------ */

describe('generated run — gated options', () => {
  it('the shortcut is hidden until the safe check yields the intel', () => {
    const run = genRun(RACE_TO_PASS_SCENARIO, 1);
    applyChoice(run, 'rp-via-a');
    if (run.nodeId === 'rp-tappa') {
      const ids = availableOptions(run).map((o) => o.id);
      expect(ids).not.toContain('rp-tagliata'); // no intel yet
      expect(ids).toContain('rp-sprint');
      expect(ids).toContain('rp-passo');
    }
    // with a party carrying the intel the option surfaces — simulated by
    // injecting the intel (the viaB win row does setInfo:'tagliata').
    const run2 = genRun(RACE_TO_PASS_SCENARIO, 1);
    run2.info.push('tagliata');
    run2.nodeId = 'rp-tappa';
    const ids2 = availableOptions(run2).map((o) => o.id);
    expect(ids2).toContain('rp-tagliata');
  });

  it('palude kit: the canale morto option requires its own intel id', () => {
    const run = genRun(RACE_TO_MARSH_SCENARIO, 1);
    run.nodeId = 'rm-tappa';
    expect(availableOptions(run).map((o) => o.id)).not.toContain('rm-tagliata');
    run.info.push('canale-morto');
    expect(availableOptions(run).map((o) => o.id)).toContain('rm-tagliata');
    // the passo intel id does NOT unlock the marsh shortcut
    const run2 = genRun(RACE_TO_MARSH_SCENARIO, 1);
    run2.nodeId = 'rm-tappa';
    run2.info.push('tagliata');
    expect(availableOptions(run2).map((o) => o.id)).not.toContain('rm-tagliata');
  });

  it('the avido leap is trait-gated (both kits)', () => {
    const greedy = genRun(RACE_TO_PASS_SCENARIO, 1, ['avido']);
    greedy.nodeId = 'rp-tappa';
    expect(availableOptions(greedy).map((o) => o.id)).toContain('rp-balzo');
    const plain = genRun(RACE_TO_PASS_SCENARIO, 1);
    plain.nodeId = 'rp-tappa';
    expect(availableOptions(plain).map((o) => o.id)).not.toContain('rp-balzo');
    const marshGreedy = genRun(RACE_TO_MARSH_SCENARIO, 1, ['avido']);
    marshGreedy.nodeId = 'rm-tappa';
    expect(availableOptions(marshGreedy).map((o) => o.id)).toContain('rm-balzo');
  });

  it('the scavezzacollo hold option surfaces only at the vetta', () => {
    const run = genRun(RACE_TO_PASS_SCENARIO, 1, ['scavezzacollo']);
    run.nodeId = 'rp-vetta';
    expect(availableOptions(run).map((o) => o.id)).toContain('rp-attesa');
    const plain2 = genRun(RACE_TO_PASS_SCENARIO, 1);
    plain2.nodeId = 'rp-vetta';
    expect(availableOptions(plain2).map((o) => o.id)).not.toContain('rp-attesa');
  });
});

/* ------------------------------------------------------------------ */
/* Race dynamics — vars, twist, outcomes                               */
/* ------------------------------------------------------------------ */

describe('generated run — race dynamics', () => {
  it('check outcomes move the race cursors on the run vars (both kits)', () => {
    for (const scenario of RACE_SCENARIOS) {
      const viaA = `${scenario.nodes[scenario.startNode]!.id.replace('partenza', 'via-a')}`;
      for (let seed = 1; seed <= 20; seed += 1) {
        const run = genRun(scenario, seed);
        applyChoice(run, viaA);
        const verdict = run.checkQueue[0]?.verdict;
        if (!verdict) continue;
        if (verdict === 'win' || verdict === 'bigwin') {
          expect(run.vars?.you).toBeGreaterThan(0);
        } else if (verdict === 'fail' || verdict === 'epicfail') {
          expect(run.vars?.rival).toBeGreaterThan(0);
        }
        break;
      }
    }
  });

  it('the armed twist diverts the route to the imboscata (both kits)', () => {
    for (const scenario of RACE_SCENARIOS) {
      const instance = createInstance(
        scenario.id === 'gen-race-passo-montano'
          ? generateRaceToPass({ twistChance: 100 })
          : generateRaceScenario(PALUDE_KIT, { twistChance: 100 }),
        { dangerScale: 1, rewardScale: 1 },
        'gen',
      );
      const viaA = `${scenario.startNode.replace('partenza', 'via-a')}`;
      const imboscata = `${scenario.startNode.replace('partenza', 'imboscata')}`;
      let witnessed = false;
      for (let seed = 1; seed <= 60 && !witnessed; seed += 1) {
        const run = createRun({
          party: party(['scavezzacollo']),
          seed,
          questId: 'gen',
          scenarioInstance: instance,
        });
        expect(run.flags).toContain('inseguimento');
        applyChoice(run, viaA);
        // The twist check resolves on arrival — the proof is the trail:
        // the run visited the imboscata node and consumed the flag.
        if (run.visitedNodes.includes(imboscata)) {
          expect(run.flags).not.toContain('inseguimento');
          witnessed = true;
        }
      }
      expect(witnessed, `twist never diverted on ${scenario.id}`).toBe(true);
    }
  });

  it('aggressive play can reach the vetta and secure the prize → reward', () => {
    const pick = (s: QuestRunState) =>
      opt(s, 'rp-via-a') ?? opt(s, 'rp-sprint') ?? opt(s, 'rp-carico') ?? availableOptions(s)[0]!.id;
    for (let seed = 1; seed <= 200; seed += 1) {
      const run = driveToEnd(genRun(RACE_TO_PASS_SCENARIO, seed), pick);
      if (run.outcome === 'reward') {
        expect(run.objectiveDone).toBe(true);
        expect(run.loot.length).toBeGreaterThan(0);
        expect(run.visitedNodes).toContain('rp-vetta');
        return;
      }
    }
    throw new Error('aggressive policy never reached a reward in 200 seeds');
  });

  it('marsh kit: aggressive play can also win → reward', () => {
    const pick = (s: QuestRunState) =>
      opt(s, 'rm-via-a') ?? opt(s, 'rm-sprint') ?? opt(s, 'rm-carico') ?? availableOptions(s)[0]!.id;
    for (let seed = 1; seed <= 200; seed += 1) {
      const run = driveToEnd(genRun(RACE_TO_MARSH_SCENARIO, seed), pick);
      if (run.outcome === 'reward') {
        expect(run.objectiveDone).toBe(true);
        return;
      }
    }
    throw new Error('marsh aggressive policy never reached a reward in 200 seeds');
  });

  it('the rival can win the race → survived without objective', () => {
    const cautiousPick = (s: QuestRunState) =>
      opt(s, 'rp-via-b') ?? opt(s, 'rp-passo') ?? opt(s, 'rp-carico') ?? availableOptions(s)[0]!.id;
    let sawLose = false;
    for (let seed = 1; seed <= 200 && !sawLose; seed += 1) {
      // Weak party to let the rival win more often.
      const weak: LabMember[] = [
        member('w1', 'leader', { agi: 15, perc: 15, str: 15, con: 15 }),
      ];
      const run = createRun({
        party: weak,
        seed,
        questId: 'gen',
        scenarioInstance: genInstance(RACE_TO_PASS_SCENARIO),
      });
      driveToEnd(run, cautiousPick);
      if (run.nodeId === 'rp-sconfitta' || (run.ended && run.outcome === 'survived' && !run.objectiveDone)) {
        sawLose = true;
        expect(run.vars?.rival).toBeGreaterThanOrEqual(6);
      }
    }
    expect(sawLose).toBe(true);
  });
});
