/**
 * R-183 — XP ai PG dal settlement + swap slot↔slot del planner.
 *
 * XP: ogni membro VIVO al settlement riceve l'XP della run (`resident-xp`,
 * modalità config `QUEST_SETTLEMENT.residentXp.mode`); i morti nulla; wipe
 * nulla. Idempotente come ogni effetto: il replay non raddoppia. Il report
 * elenca chi ha preso quanto.
 *
 * Swap: `planSlotSwap` sposta su slot vuoto, scambia su slot occupato, e
 * rifiuta se UNO dei due atterraggi viola l'eleggibilità.
 */
import { describe, expect, it } from 'vitest';
import { applyPlanToState, deriveSettlementPlan } from '@/ui/idleVillage/quests/questSettlement';
import { buildQuestEpilogue } from '@/ui/idleVillage/quests/questEpilogue';
import { planSlotSwap } from '@/ui/idleVillage/quests/questExpedition';
import { planRosterSlotReplace } from '@/ui/idleVillage/quests/questExpeditionRosterSwap';
import { QUEST_SETTLEMENT } from '@/balancing/config/idleVillage/quests/questSettlement';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { MinimalGameplayState } from '@/store/useMinimalGameplay';

type MinimalState = MinimalGameplayState['state'];

function terminalRun(over: Partial<QuestRunState>): QuestRunState {
  return {
    questId: 'goblin',
    party: [
      { id: 'a', name: 'Alfa', stats: {}, role: 'leader', hp: 40, maxHp: 100, wounded: false, dead: false },
      { id: 'b', name: 'Beta', stats: {}, role: 'member', hp: 10, maxHp: 60, wounded: true, dead: false },
      { id: 'c', name: 'Gamma', stats: {}, role: 'member', hp: 0, maxHp: 60, wounded: false, dead: true },
    ],
    gold: 0,
    loot: [],
    info: [],
    flags: [],
    objectiveDone: true,
    ended: true,
    outcome: 'reward',
    xp: 30,
    frontier: { status: 'waiting', startedAt: 0, readyAt: 0 },
    scenarioInstanceId: 'qsi-xp-1',
    ...over,
  } as QuestRunState;
}

function state(): MinimalState {
  return {
    gold: 0,
    xp: 0,
    appliedQuestEffectIds: [],
    residents: [
      { id: 'a', name: 'Alfa', isWorking: false, isInjured: false, fatigue: 0, xp: 5 } as never,
      { id: 'b', name: 'Beta', isWorking: false, isInjured: false, fatigue: 0 } as never,
      { id: 'c', name: 'Gamma', isWorking: false, isInjured: false, fatigue: 0 } as never,
    ],
  } as MinimalState;
}

describe('R-183 resident XP', () => {
  it('ogni sopravvissuto riceve la XP della run, i morti no', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    const credited = plan.effects.filter((e) => e.kind === 'resident-xp');
    expect(QUEST_SETTLEMENT.residentXp.mode).toBe('full');
    expect(credited.map((e) => [e.residentId, e.amount])).toEqual([
      ['a', 30],
      ['b', 30],
    ]);
    /* the village total is untouched */
    expect(plan.effects.some((e) => e.kind === 'village-xp' && e.amount === 30)).toBe(true);
  });

  it('applica come delta sul totale del residente ed è idempotente', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    const once = applyPlanToState(state(), plan, 100).next;
    expect(once.residents.find((r) => r.id === 'a')?.xp).toBe(35);
    expect(once.residents.find((r) => r.id === 'b')?.xp).toBe(30);
    expect(once.residents.find((r) => r.id === 'c')?.xp).toBeUndefined();
    const twice = applyPlanToState(once, plan, 101).next;
    expect(twice.residents.find((r) => r.id === 'a')?.xp).toBe(35);
    expect(twice.eventLog?.filter((e) => e.messageKey === 'gameFrame.questLog.residentXp')).toHaveLength(2);
  });

  it('wipe: nessuna XP a nessuno', () => {
    const plan = deriveSettlementPlan(terminalRun({ outcome: 'wipe', objectiveDone: false }));
    expect(plan.effects.filter((e) => e.kind === 'resident-xp')).toHaveLength(0);
  });

  it('il report elenca la XP per membro al posto del totale', () => {
    const xp = buildQuestEpilogue(terminalRun({})).find((s) => s.id === 'xp');
    expect(xp?.lines).toEqual([
      { key: 'gameFrame.questEpilogue.memberXp', params: { name: 'Alfa', amount: 30 } },
      { key: 'gameFrame.questEpilogue.memberXp', params: { name: 'Beta', amount: 30 } },
    ]);
  });
});

describe('R-183 planSlotSwap', () => {
  const all = () => true;

  it('slot vuoto: sposta senza estrarre', () => {
    expect(planSlotSwap({ s1: 'a', s2: null }, 's1', 's2', all)).toEqual({ s1: null, s2: 'a' });
  });

  it('slot occupato: scambia i due PG', () => {
    expect(planSlotSwap({ s1: 'a', s2: 'b' }, 's1', 's2', all)).toEqual({ s1: 'b', s2: 'a' });
  });

  it('rifiuta se il PG spostato non è eleggibile per la destinazione', () => {
    const gate = (r: string, s: string) => !(r === 'a' && s === 's2');
    expect(planSlotSwap({ s1: 'a', s2: 'b' }, 's1', 's2', gate)).toBeNull();
  });

  it('rifiuta se il PG scalzato non è eleggibile per lo slot di partenza', () => {
    const gate = (r: string, s: string) => !(r === 'b' && s === 's1');
    expect(planSlotSwap({ s1: 'a', s2: 'b' }, 's1', 's2', gate)).toBeNull();
  });

  it('no-op su stesso slot o sorgente vuota', () => {
    expect(planSlotSwap({ s1: 'a' }, 's1', 's1', all)).toBeNull();
    expect(planSlotSwap({ s1: null, s2: 'b' }, 's1', 's2', all)).toBeNull();
  });
});

// INV:use-quest-expedition-session.INV-5 — R-281: a roster medallion dropped
// on an occupied seat takes it; the displaced resident leaves `assignments`
// entirely (derived roster = back to roster, no gate on the way out). Only
// the incoming resident crosses the eligibility gate.
describe('R-281 planRosterSlotReplace', () => {
  const all = () => true;

  it('slot occupato: il trascinato prende il castone, lo scalzato torna al roster', () => {
    const next = planRosterSlotReplace({ s1: 'a', s2: 'b' }, 's2', 'c', all);
    expect(next).toEqual({ s1: 'a', s2: 'c' });
    expect(Object.values(next!)).not.toContain('b');
  });

  it('slot vuoto: assegnazione normale', () => {
    expect(planRosterSlotReplace({ s1: 'a', s2: null }, 's2', 'c', all)).toEqual({ s1: 'a', s2: 'c' });
  });

  it('rifiuta se il trascinato non è eleggibile per il castone', () => {
    const gate = (r: string, s: string) => !(r === 'c' && s === 's2');
    expect(planRosterSlotReplace({ s1: 'a', s2: 'b' }, 's2', 'c', gate)).toBeNull();
  });

  it('lo scalzato non deve essere eleggibile per nulla — va al roster', () => {
    const gate = (r: string) => r !== 'b'; // 'b' non eleggibile da nessuna parte: esce comunque
    expect(planRosterSlotReplace({ s1: 'a', s2: 'b' }, 's2', 'c', gate)).toEqual({ s1: 'a', s2: 'c' });
  });

  it('no-op su stesso residente (assignments è sparsa: l\u2019esistenza del castone resta al chiamante)', () => {
    expect(planRosterSlotReplace({ s1: 'a' }, 's1', 'a', all)).toBeNull();
  });
});
