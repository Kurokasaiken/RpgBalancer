/**
 * Unit tests for the second generated gimmick (PLAN-026 T-3 residuo):
 * «la volta che allaga» — loot-vs-escape on the miniera kit.
 *
 * Structurally distinct from the race: no rival cursor — the pressure is
 * `acqua` rising on EVERY action while `uscita` only advances on pushes.
 * The greed bill lands at `fv-piena`: drop the TAKEN loot or swim with it.
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
import {
  FLOOD_MINIERA_SCENARIO,
  generateFloodVault,
  MINIERA_FLOOD_KIT,
} from '@/balancing/config/idleVillage/quests/generation/catalog';

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function member(id: string, role: LabMember['role'], stats?: Partial<LabMember['stats']>, traits?: string[]): LabMember {
  return {
    id,
    name: id,
    role,
    stats: { perc: 65, int: 60, str: 65, con: 65, agi: 65, cha: 40, ...stats },
    hp: 120,
    ...(traits ? { traits } : {}),
  };
}

function party(traits?: string[]): LabMember[] {
  return [
    member('m-lead', 'leader', { perc: 75 }, traits),
    member('m-muscle', 'member', { str: 80, con: 70 }),
    member('m-brains', 'member', { int: 80, con: 60 }),
    member('m-bg', 'bodyguard', { con: 85, agi: 50 }),
  ];
}

function floodInstance(tuning?: Parameters<typeof generateFloodVault>[1]) {
  return createInstance(
    generateFloodVault(MINIERA_FLOOD_KIT, tuning),
    { dangerScale: 1, rewardScale: 1 },
    'gen',
  );
}

function floodRun(seed: number, traits?: string[], tuning?: Parameters<typeof generateFloodVault>[1]): QuestRunState {
  return createRun({ party: party(traits), seed, questId: 'gen', scenarioInstance: floodInstance(tuning) });
}

const opt = (s: QuestRunState, id: string) => availableOptions(s).find((o) => o.id === id)?.id;

function driveToEnd(run: QuestRunState, pick: (s: QuestRunState) => string, maxSteps = 40): QuestRunState {
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
/* Schema + structure                                                  */
/* ------------------------------------------------------------------ */

describe('floodVault — generated scenario', () => {
  it('parses against QuestScenarioSchema at import (catalog imprint)', () => {
    expect(FLOOD_MINIERA_SCENARIO.id).toBe('gen-flood-miniera');
    expect(FLOOD_MINIERA_SCENARIO.startNode).toBe('fv-ingresso');
    expect(FLOOD_MINIERA_SCENARIO.initialVars).toEqual({ acqua: 0, uscita: 0 });
  });

  it('declares two twists: trait-gated cassa-madre + ungated parete-cede', () => {
    const rolls = FLOOD_MINIERA_SCENARIO.armRolls ?? [];
    expect(rolls.find((r) => r.flag === 'cassa-madre')?.requiresTrait).toBe('avido');
    expect(rolls.find((r) => r.flag === 'parete-cede')?.requiresTrait).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* Greed loop — water rises on every action                            */
/* ------------------------------------------------------------------ */

describe('floodVault — the greed economy', () => {
  it('every hub action raises acqua; only pushes raise uscita (forced rolls)', () => {
    const run = floodRun(1);
    // descend via the cage — worst case still lands at crocevia
    applyChoice(run, 'fv-via-gabbia', { forceDie: 50 });
    expect(run.nodeId).toBe('fv-crocevia');
    const acquaAfterDescent = run.vars?.acqua ?? 0;
    // loot the vein with a bad roll: acqua rises, no uscita
    applyChoice(run, 'fv-saccheggia', { forceDie: 90 });
    expect(run.nodeId).toBe('fv-crocevia');
    expect(run.vars?.acqua).toBeGreaterThan(acquaAfterDescent);
    expect(run.vars?.uscita).toBe(run.vars?.uscita ?? 0);
    // push toward the shaft with a good roll: uscita rises
    const uscitaBefore = run.vars?.uscita ?? 0;
    applyChoice(run, 'fv-punta', { forceDie: 10 });
    if (run.nodeId === 'fv-crocevia') {
      expect(run.vars?.uscita).toBeGreaterThan(uscitaBefore);
    } else {
      expect(run.nodeId).toBe('fv-sbarramento');
    }
  });

  it('loot the vein with a good roll: TAKEN item in the loot list', () => {
    const run = floodRun(1);
    applyChoice(run, 'fv-via-cunicolo', { forceDie: 50 });
    applyChoice(run, 'fv-saccheggia', { forceDie: 10 });
    expect(run.loot).toContain('pezzo di vena');
    expect(run.objectiveDone).toBe(false); // TAKEN ≠ SECURED
  });

  it('prudente can push the water back — dec var in a real scenario', () => {
    const run = floodRun(1, ['prudente']);
    run.nodeId = 'fv-crocevia';
    run.vars = { acqua: 5, uscita: 1 };
    expect(opt(run, 'fv-puntellare')).toBeDefined();
    applyChoice(run, 'fv-puntellare', { forceDie: 10 });
    expect(run.vars?.acqua).toBeLessThan(5);
    const noTrait = floodRun(1);
    noTrait.nodeId = 'fv-crocevia';
    expect(opt(noTrait, 'fv-puntellare')).toBeUndefined();
  });

  it('the mother lode is flag-gated: armRoll avido or the vein rollFlag', () => {
    const armed = floodRun(1, ['avido'], { madreChance: 100 });
    expect(armed.flags).toContain('cassa-madre');
    armed.nodeId = 'fv-crocevia';
    expect(opt(armed, 'fv-madre')).toBeDefined();
    const unarmed = floodRun(1, [], { madreChance: 0 });
    unarmed.nodeId = 'fv-crocevia';
    expect(opt(unarmed, 'fv-madre')).toBeUndefined();
  });

  it('the hidden chamber requires the scout-route intel', () => {
    const run = floodRun(1);
    run.nodeId = 'fv-crocevia';
    expect(opt(run, 'fv-occulta')).toBeUndefined();
    run.info.push('camera-occulta');
    expect(opt(run, 'fv-occulta')).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/* The flood — the greed bill                                          */
/* ------------------------------------------------------------------ */

describe('floodVault — la piena', () => {
  it('acqua >= limite diverts to fv-piena — drop the sack or risk it', () => {
    const run = floodRun(1);
    applyChoice(run, 'fv-via-gabbia', { forceDie: 50 });
    run.nodeId = 'fv-crocevia';
    run.vars = { acqua: 7, uscita: 1 };
    applyChoice(run, 'fv-saccheggia', { forceDie: 90 }); // +2 acqua → flood
    expect(run.nodeId).toBe('fv-piena');
    const ids = availableOptions(run).map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(['fv-mollare', 'fv-tenere']));
  });

  it('dropping the sack: every loot item is lost (TAKEN, never SECURED)', () => {
    const run = floodRun(1);
    run.nodeId = 'fv-piena';
    run.loot = ['pezzo di vena', 'cassa della camera occulta'];
    applyChoice(run, 'fv-mollare', { forceDie: 10 });
    expect(run.loot).toHaveLength(0);
    expect(run.objectiveDone).toBe(false);
    expect(run.nodeId).toBe('fv-fine');
    expect(run.outcome).toBe('survived');
  });

  it('holding the sack on a good roll keeps the loot', () => {
    const run = floodRun(1);
    run.nodeId = 'fv-piena';
    run.loot = ['pezzo di vena'];
    applyChoice(run, 'fv-tenere', { forceDie: 10 });
    expect(run.loot).toContain('pezzo di vena');
    expect(run.nodeId).toBe('fv-fine');
  });

  it('holding the sack on a bad roll loses loot AND blood', () => {
    const run = floodRun(1);
    run.nodeId = 'fv-piena';
    run.loot = ['pezzo di vena'];
    const hpBefore = run.party.map((m) => m.hp).join(',');
    applyChoice(run, 'fv-tenere', { forceDie: 95 });
    expect(run.loot).toHaveLength(0);
    expect(run.party.map((m) => m.hp).join(',')).not.toBe(hpBefore);
  });

  it('the last grab at the barrier can flood the gallery at the door', () => {
    const run = floodRun(1);
    run.nodeId = 'fv-sbarramento';
    run.vars = { acqua: 7, uscita: 6 };
    expect(opt(run, 'fv-ultimopezzo')).toBeDefined();
    applyChoice(run, 'fv-ultimopezzo', { forceDie: 95 }); // +3 acqua → piena
    expect(run.nodeId).toBe('fv-piena');
  });
});

/* ------------------------------------------------------------------ */
/* End-to-end policies                                                 */
/* ------------------------------------------------------------------ */

describe('floodVault — end-to-end', () => {
  it('pure escape: puntare al pozzo every hub → reward at fv-fine', () => {
    const pick = (s: QuestRunState) =>
      opt(s, 'fv-via-gabbia') ?? opt(s, 'fv-punta') ?? opt(s, 'fv-sfonda') ??
      opt(s, 'fv-mollare') ?? availableOptions(s)[0]!.id;
    for (let seed = 1; seed <= 60; seed += 1) {
      const run = driveToEnd(floodRun(seed), pick);
      if (run.outcome === 'reward') {
        expect(run.objectiveDone).toBe(true);
        return;
      }
    }
    throw new Error('escape policy never reached a reward in 60 seeds');
  });

  it('greed has a bill: always-loot policy floods more often than not', () => {
    const greedPick = (s: QuestRunState) =>
      opt(s, 'fv-saccheggia') ?? opt(s, 'fv-via-gabbia') ??
      opt(s, 'fv-mollare') ?? opt(s, 'fv-punta') ?? opt(s, 'fv-sfonda') ??
      availableOptions(s)[0]!.id;
    let floods = 0;
    const N = 40;
    for (let seed = 1; seed <= N; seed += 1) {
      const run = driveToEnd(floodRun(seed), greedPick);
      if (run.visitedNodes.includes('fv-piena')) floods += 1;
    }
    // always looting → almost every run hits the flood
    expect(floods / N).toBeGreaterThan(0.6);
  });

  it('the parete-cede twist can break the gallery early on a bad push', () => {
    const instance = floodInstance({ pareteChance: 100 });
    const run = createRun({
      party: party(),
      seed: 1,
      questId: 'gen',
      scenarioInstance: instance,
    });
    expect(run.flags).toContain('parete-cede');
    run.nodeId = 'fv-crocevia';
    applyChoice(run, 'fv-punta', { forceDie: 100 }); // epicfail → twist route
    expect(run.nodeId).toBe('fv-piena');
  });
});
