/**
 * Unit tests for the first GENERATED scenario (PLAN-026 T-3): «La Corsa al
 * Passo» — core gimmick gara-di-avanzamento on the passo-montano kit.
 *
 * Proves the v2 engine can execute a generated catalog scenario end-to-end:
 * schema parse at import, runstart armRolls trait-gating, vars racing to the
 * goal, the 'inseguimento' twist branch changing the route, trait/info-gated
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
import {
  generateRaceToPass,
  RACE_TO_PASS_SCENARIO,
} from '@/balancing/config/idleVillage/quests/generation/raceToPass';

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

/** Instance of the generated scenario at neutral scales, questId 'gen'. */
function raceInstance() {
  return createInstance(RACE_TO_PASS_SCENARIO, { dangerScale: 1, rewardScale: 1 }, 'gen');
}

function raceRun(seed: number, traits?: string[]): QuestRunState {
  return createRun({ party: party(traits), seed, questId: 'gen', scenarioInstance: raceInstance() });
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

/* ------------------------------------------------------------------ */
/* Schema + generator                                                  */
/* ------------------------------------------------------------------ */

describe('raceToPass — generated scenario', () => {
  it('parses against QuestScenarioSchema at import (frozen catalog)', () => {
    expect(RACE_TO_PASS_SCENARIO.id).toBe('gen-race-to-pass');
    expect(RACE_TO_PASS_SCENARIO.startNode).toBe('rp-partenza');
    expect(RACE_TO_PASS_SCENARIO.initialVars).toEqual({ you: 0, rival: 0, goal: 6 });
  });

  it('generator is parametrized: goal and twistChance propagate', () => {
    const s = generateRaceToPass({ goal: 4, twistChance: 90 });
    expect(s.initialVars?.goal).toBe(4);
    expect(s.armRolls?.[0]?.chance).toBe(90);
    expect(s.scenarioVersion).toBe('gen-race-4-90');
  });

  it('every check node carries a verdictTable (data-driven, no legacy path)', () => {
    const checks = Object.values(RACE_TO_PASS_SCENARIO.nodes).filter((n) => n.kind === 'check');
    expect(checks.length).toBeGreaterThanOrEqual(6);
    for (const c of checks) expect(c.verdictTable).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/* Run creation on the 'gen' profile                                   */
/* ------------------------------------------------------------------ */

describe('raceToPass — run on the gen profile', () => {
  it('createRun on the instance seeds the race vars and starts on rp-partenza', () => {
    const run = raceRun(1);
    expect(run.questId).toBe('gen');
    expect(run.nodeId).toBe('rp-partenza');
    expect(run.vars).toEqual({ you: 0, rival: 0, goal: 6 });
    expect(nodesFor(run)).toBe(raceInstance().nodes);
  });

  it("questId 'gen' without an instance throws — no empty authored map", () => {
    expect(() =>
      createRun({ party: party(), seed: 1, questId: 'gen' }),
    ).toThrow(/gen.*ScenarioInstance/);
  });

  it('the Scavezzacollo armRoll gates the twist arming', () => {
    const instance = createInstance(
      generateRaceToPass({ twistChance: 100 }),
      { dangerScale: 1, rewardScale: 1 },
      'gen',
    );
    const reckless = createRun({
      party: party(['scavezzacollo']),
      seed: 1,
      questId: 'gen',
      scenarioInstance: instance,
    });
    expect(reckless.flags).toContain('inseguimento');
    const prudent = createRun({
      party: party(),
      seed: 1,
      questId: 'gen',
      scenarioInstance: instance,
    });
    expect(prudent.flags).not.toContain('inseguimento');
  });
});

/* ------------------------------------------------------------------ */
/* Options gating — info and traits                                    */
/* ------------------------------------------------------------------ */

describe('raceToPass — gated options at the hub', () => {
  it('the shortcut is hidden until the orme check yields the intel', () => {
    const run = raceRun(1);
    applyChoice(run, 'rp-via-crepa');
    if (run.nodeId === 'rp-tappa') {
      const ids = availableOptions(run).map((o) => o.id);
      expect(ids).not.toContain('rp-tagliata'); // no intel yet
      expect(ids).toContain('rp-sprint');
      expect(ids).toContain('rp-passo');
    }
    // with a party carrying the intel the option surfaces — simulated by
    // injecting the intel (the orme win row does setInfo:'tagliata').
    const run2 = raceRun(1);
    run2.info.push('tagliata');
    run2.nodeId = 'rp-tappa';
    const ids2 = availableOptions(run2).map((o) => o.id);
    expect(ids2).toContain('rp-tagliata');
  });

  it('the avido leap is trait-gated', () => {
    const greedy = raceRun(1, ['avido']);
    greedy.nodeId = 'rp-tappa';
    expect(availableOptions(greedy).map((o) => o.id)).toContain('rp-balzo');
    const plain = raceRun(1);
    plain.nodeId = 'rp-tappa';
    expect(availableOptions(plain).map((o) => o.id)).not.toContain('rp-balzo');
  });

  it('the scavezzacollo hold-the-pass option surfaces only at the vetta', () => {
    const run = raceRun(1, ['scavezzacollo']);
    run.nodeId = 'rp-vetta';
    expect(availableOptions(run).map((o) => o.id)).toContain('rp-attesa');
    const plain2 = raceRun(1);
    plain2.nodeId = 'rp-vetta';
    expect(availableOptions(plain2).map((o) => o.id)).not.toContain('rp-attesa');
  });
});

/* ------------------------------------------------------------------ */
/* Race dynamics — vars and the twist                                  */
/* ------------------------------------------------------------------ */

describe('raceToPass — race dynamics', () => {
  it('check outcomes move the race cursors on the run vars', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const run = raceRun(seed);
      applyChoice(run, 'rp-via-crepa');
      const verdict = run.checkQueue[0]?.verdict;
      if (!verdict) continue;
      if (verdict === 'win' || verdict === 'bigwin') {
        expect(run.vars?.you).toBeGreaterThan(0);
      } else if (verdict === 'fail' || verdict === 'epicfail') {
        expect(run.vars?.rival).toBeGreaterThan(0);
      }
      return; // one landed verdict is enough
    }
    throw new Error('no check landed in 20 seeds');
  });

  it('the armed twist diverts the route to rp-imboscata', () => {
    const instance = createInstance(
      generateRaceToPass({ twistChance: 100 }),
      { dangerScale: 1, rewardScale: 1 },
      'gen',
    );
    for (let seed = 1; seed <= 60; seed += 1) {
      const run = createRun({
        party: party(['scavezzacollo']),
        seed,
        questId: 'gen',
        scenarioInstance: instance,
      });
      expect(run.flags).toContain('inseguimento');
      applyChoice(run, 'rp-via-crepa');
      // The twist check resolves on arrival — the proof is in the trail:
      // the run visited rp-imboscata and the flag was consumed by it.
      if (run.visitedNodes.includes('rp-imboscata')) {
        expect(run.flags).not.toContain('inseguimento'); // consumed by the fight
        return;
      }
    }
    throw new Error('armed twist never diverted to rp-imboscata in 60 seeds');
  });

  it('aggressive play can reach the vetta and secure the prize → reward', () => {
    const pick = (s: QuestRunState) =>
      availableOptions(s).find((o) => o.id === 'rp-via-crepa')?.id ??
      availableOptions(s).find((o) => o.id === 'rp-sprint')?.id ??
      availableOptions(s).find((o) => o.id === 'rp-carico')?.id ??
      availableOptions(s)[0]!.id;
    for (let seed = 1; seed <= 200; seed += 1) {
      const run = driveToEnd(raceRun(seed), pick);
      if (run.outcome === 'reward') {
        expect(run.objectiveDone).toBe(true);
        expect(run.loot.length).toBeGreaterThan(0);
        expect(run.visitedNodes).toContain('rp-vetta');
        return;
      }
    }
    throw new Error('aggressive policy never reached a reward in 200 seeds');
  });

  it('the rival can win the race → survived without objective', () => {
    const cautiousPick = (s: QuestRunState) =>
      availableOptions(s).find((o) => o.id === 'rp-via-orme')?.id ??
      availableOptions(s).find((o) => o.id === 'rp-passo')?.id ??
      availableOptions(s).find((o) => o.id === 'rp-carico')?.id ??
      availableOptions(s)[0]!.id;
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
        scenarioInstance: raceInstance(),
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
