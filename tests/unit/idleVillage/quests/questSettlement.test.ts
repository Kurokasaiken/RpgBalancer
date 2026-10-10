/**
 * PLAN-019-S2.5 T-3 — settlement: piani per esito, idempotenza per chiave,
 * fault injection crash→replay→crash, convergenza allo stesso stato finale.
 *
 * Invarianti (tabella T-1 + critica r2):
 *  - reward = solo `objectiveDone && leader vivo` (il motore lo garantisce:
 *    `fled` ⇒ `objectiveDone=false` via dropObjective);
 *  - wipe = ∀ slot morti → tutto perso (nessun effetto economia/loot);
 *  - chiave `(runId, effectKey)` nello stesso aggregato della mutazione —
 *    il replay ri-applica il piano e deduplica, mai `set-to-expected`;
 *  - il marker `settled` è l'ULTIMA scrittura: crash dopo gli effetti lascia
 *    il run `settling`, il boot lo replica e converge.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyPlanToState,
  deriveSettlementPlan,
  runIdOf,
  settleRun,
  type SettlementMarker,
  type SettlementPlan,
} from '@/ui/idleVillage/quests/questSettlement';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { MinimalGameplayState } from '@/store/useMinimalGameplay';
import { clearData } from '@/shared/persistence/PersistenceService';
import { releaseLoadout, reserveLoadout, reservedItemIds } from '@/ui/idleVillage/questS1Lab/expeditionLoadout';
import { QUEST_SETTLEMENT } from '@/balancing/config/idleVillage/quests/questSettlement';

type MinimalState = MinimalGameplayState['state'];

/* ------------------------------------------------------------------ */
/* Factories                                                          */
/* ------------------------------------------------------------------ */

/** A terminal run literal — only the fields the settlement reads. */
function terminalRun(over: Partial<QuestRunState>): QuestRunState {
  return {
    seed: 7,
    rngCalls: 0,
    questId: 'goblin',
    presetId: 'test',
    nodeId: 'gob-end',
    party: [
      { id: 'hero-leader', name: 'Leader', stats: {}, role: 'leader', hp: 40, maxHp: 100, wounded: false, dead: false },
      { id: 'hero-member', name: 'Member', stats: {}, role: 'member', hp: 10, maxHp: 60, wounded: true, dead: false },
    ],
    gold: 15,
    days: 1,
    bottinoOro: 0,
    loot: ['trofeo dei goblin'],
    info: [],
    flags: [],
    alarm: false,
    objectiveDone: true,
    ended: true,
    outcome: 'reward',
    lastEvent: '',
    checkQueue: [],
    log: [],
    combatTurn: 0,
    goblinLeft: 0,
    exploreTurn: 0,
    xp: 3,
    engineSchemaVersion: 2,
    frontierVersion: 1,
    frontier: { status: 'waiting', startedAt: 0, readyAt: 0 },
    nodeTicks: 10,
    visitedNodes: ['gob-end'],
    scenarioInstanceId: 'qsi-test-1',
    launchedAtTick: 100,
    resolvedOffer: {
      offerSchemaVersion: 1,
      poiId: 'poi-goblin',
      questId: 'goblin',
      rewardResolved: 42,
      resolvedAtDay: 0,
    } as QuestRunState['resolvedOffer'],
    ...over,
  } as QuestRunState;
}

/** A minimal gameplay slice — only the fields applyPlanToState touches. */
function minimalState(over: Partial<MinimalState>): MinimalState {
  return {
    gold: 10,
    xp: 0,
    appliedQuestEffectIds: [],
    residents: [
      { id: 'hero-leader', name: 'Leader', isWorking: false, isInjured: false, fatigue: 0 } as never,
      { id: 'hero-member', name: 'Member', isWorking: true, isInjured: false, fatigue: 0 } as never,
    ],
    ...over,
  } as MinimalState;
}

/* Journal test double: records writes, applies effects to a fake store,
 * and releases through the REAL reservation aggregate so the fault tests
 * exercise persistence, not mocks. */
function makeDeps(plan?: SettlementPlan) {
  const markers: SettlementMarker[] = [];
  const store = { state: minimalState({}) };
  const deps = {
    persistRun: (m: SettlementMarker) => void markers.push(m),
    applyToStore: (p: SettlementPlan) => {
      store.state = applyPlanToState(store.state, p, 200).next;
    },
    releaseLoadout,
    nowTick: () => 200,
    fault: undefined as undefined | { crashAfter?: 'intent' | 'effects' },
  };
  return { deps, markers, store };
}

beforeEach(async () => {
  await clearData('idleVillage.expeditionLoadout');
});

/* ------------------------------------------------------------------ */
/* Plan derivation — the outcome table                                  */
/* ------------------------------------------------------------------ */

describe('deriveSettlementPlan', () => {
  it('reward: rewardResolved + run gold + xp, member effects by fate', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    expect(plan.outcome).toBe('reward');
    expect(plan.leaderAlive).toBe(true);
    const gold = plan.effects.filter((e) => e.kind === 'village-gold').reduce((s, e) => s + (e.amount ?? 0), 0);
    expect(gold).toBe(42 + 15); // rewardResolved + run.gold
    expect(plan.effects.some((e) => e.kind === 'village-xp' && e.amount === 3)).toBe(true);
    expect(plan.effects).toContainEqual(
      expect.objectContaining({ kind: 'resident-wounded', residentId: 'hero-member' }),
    );
    expect(plan.effects.some((e) => e.kind === 'loadout-release')).toBe(true);
  });

  it('wipe: tutto perso — no gold, no xp, dead residents still recorded', () => {
    const plan = deriveSettlementPlan(
      terminalRun({
        outcome: 'wipe',
        objectiveDone: false,
        loot: [],
        party: [
          { id: 'hero-leader', name: 'L', stats: {}, role: 'leader', hp: 0, maxHp: 100, wounded: false, dead: true },
          { id: 'hero-member', name: 'M', stats: {}, role: 'member', hp: 0, maxHp: 60, wounded: false, dead: true },
        ],
      }),
    );
    expect(plan.effects.filter((e) => e.kind === 'village-gold' || e.kind === 'village-xp')).toHaveLength(0);
    expect(plan.effects.filter((e) => e.kind === 'resident-dead')).toHaveLength(2);
    // The bag is still released even on wipe.
    expect(plan.effects.some((e) => e.kind === 'loadout-release')).toBe(true);
  });

  it('fled: obiettivo perso in fuga → no reward, bottino in mano conservato', () => {
    const plan = deriveSettlementPlan(terminalRun({ outcome: 'fled', objectiveDone: false }));
    expect(plan.effects.some((e) => e.key === 'reward:village-gold')).toBe(false);
    const gold = plan.effects.filter((e) => e.kind === 'village-gold').reduce((s, e) => s + (e.amount ?? 0), 0);
    expect(gold).toBe(15); // solo run.gold — il trofeo/rewardResolved non paga
  });

  it('survived con leader morto: nessun reward anche se obiettivo preso', () => {
    const plan = deriveSettlementPlan(
      terminalRun({
        outcome: 'survived',
        objectiveDone: true,
        party: [
          { id: 'hero-leader', name: 'L', stats: {}, role: 'leader', hp: 0, maxHp: 100, wounded: false, dead: true },
          { id: 'hero-member', name: 'M', stats: {}, role: 'member', hp: 55, maxHp: 60, wounded: false, dead: false },
        ],
      }),
    );
    expect(plan.effects.some((e) => e.key === 'reward:village-gold')).toBe(false);
    expect(plan.effects).toContainEqual(
      expect.objectContaining({ kind: 'resident-dead', residentId: 'hero-leader' }),
    );
  });
});

/* ------------------------------------------------------------------ */
/* applyPlanToState — idempotenza in-aggregato                          */
/* ------------------------------------------------------------------ */

describe('applyPlanToState', () => {
  it('applies effects and keys them inside the same aggregate', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    const { next, appliedNow } = applyPlanToState(minimalState({}), plan, 200);
    expect(next.gold).toBe(10 + 42 + 15);
    expect(next.xp).toBe(3);
    expect(next.residents.find((r) => r.id === 'hero-member')?.isInjured).toBe(true);
    expect(next.residents.find((r) => r.id === 'hero-member')?.isWorking).toBe(false);
    expect(next.residents.find((r) => r.id === 'hero-member')?.injuredUntilTick).toBe(200 + QUEST_SETTLEMENT.woundRecoveryTicks);
    expect(appliedNow.length).toBe(plan.effects.length); // every effect keyed, loadout-release included
  });

  it('second call is a no-op — nothing applied twice', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    const first = applyPlanToState(minimalState({}), plan, 200).next;
    const second = applyPlanToState(first, plan, 200);
    expect(second.appliedNow).toHaveLength(0);
    expect(second.next.gold).toBe(first.gold);
    expect(second.next.residents).toEqual(first.residents);
  });
});

/* ------------------------------------------------------------------ */
/* eventLog (PLAN-019-S4 T-1) — the village remembers the run           */
/* ------------------------------------------------------------------ */

describe('eventLog', () => {
  it('writes an outcome headline plus one line per applied effect', () => {
    const plan = deriveSettlementPlan(terminalRun({}), { questTitle: 'Sterminio dei goblin' });
    const { next } = applyPlanToState(minimalState({}), plan, 200);
    const log = next.eventLog ?? [];
    /* Entries: outcome + wounded(hero-member) + goldReward(42) + goldLoot(15)
     * + xp(3) — loadout-release stays silent. */
    expect(log).toHaveLength(5);

    const headline = log[0];
    expect(headline.type).toBe('quest_outcome');
    expect(headline.severity).toBe('success'); // outcome=reward
    expect(headline.messageKey).toBe('gameFrame.questLog.outcome.reward');
    expect(headline.messageParams).toEqual({ quest: 'Sterminio dei goblin' });
    expect(headline.id).toBe(`${plan.runId}:log:outcome`);

    const wounded = log[1];
    expect(wounded.type).toBe('quest_settlement');
    expect(wounded.severity).toBe('warning');
    expect(wounded.residentId).toBe('hero-member');
    expect(wounded.messageKey).toBe('gameFrame.questLog.residentWounded');
    expect(wounded.messageParams).toEqual({ name: 'Member' });

    expect(log[2].messageKey).toBe('gameFrame.questLog.goldReward');
    expect(log[2].messageParams).toEqual({ amount: 42, quest: 'Sterminio dei goblin' });
    expect(log[3].messageKey).toBe('gameFrame.questLog.goldLoot');
    expect(log[3].messageParams).toEqual({ amount: 15, quest: 'Sterminio dei goblin' });
    expect(log[4].messageKey).toBe('gameFrame.questLog.xp');
  });

  it('is idempotent — replay never narrates twice', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    const first = applyPlanToState(minimalState({}), plan, 200).next;
    const second = applyPlanToState(first, plan, 200);
    expect(second.appliedNow).toHaveLength(0);
    expect(second.next.eventLog).toEqual(first.eventLog);
  });

  it('wipe headline is an error line; a dead resident is named', () => {
    const plan = deriveSettlementPlan(
      terminalRun({
        outcome: 'wipe',
        objectiveDone: false,
        loot: [],
        party: [
          { id: 'hero-leader', name: 'L', stats: {}, role: 'leader', hp: 0, maxHp: 100, wounded: false, dead: true },
          { id: 'hero-member', name: 'M', stats: {}, role: 'member', hp: 0, maxHp: 60, wounded: false, dead: true },
        ],
      }),
    );
    const { next } = applyPlanToState(minimalState({}), plan, 200);
    const log = next.eventLog ?? [];
    expect(log[0].severity).toBe('error');
    expect(log[0].messageKey).toBe('gameFrame.questLog.outcome.wipe');
    const dead = log.filter((e) => e.messageKey === 'gameFrame.questLog.residentDead');
    expect(dead).toHaveLength(2);
    expect(dead[0].severity).toBe('error');
    /* The village names the fallen from the roster, not the run record. */
    expect(dead[0].messageParams).toEqual({ name: 'Leader' });
    /* Wipe drops gold/xp — no economy lines. */
    expect(log.some((e) => e.messageKey === 'gameFrame.questLog.goldReward')).toBe(false);
    expect(log.some((e) => e.messageKey === 'gameFrame.questLog.xp')).toBe(false);
  });

  it('falls back to questId in the copy when no title is passed', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    const { next } = applyPlanToState(minimalState({}), plan, 200);
    expect(next.eventLog?.[0].messageParams).toEqual({ quest: 'goblin' });
  });

  it('respects the event-log tail cap', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    const prior = Array.from({ length: 98 }, (_, i) => ({
      id: `old-${i}`,
      timestamp: i,
      severity: 'info' as const,
      message: `old ${i}`,
    }));
    const { next } = applyPlanToState(minimalState({ eventLog: prior }), plan, 200, {
      eventLogLimit: 100,
    });
    expect(next.eventLog).toHaveLength(100);
    expect(next.eventLog?.[99].messageKey).toBe('gameFrame.questLog.xp');
    expect(next.eventLog?.some((e) => e.id === 'old-0')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* settleRun — journal, fault injection, replay convergence             */
/* ------------------------------------------------------------------ */

describe('settleRun journal', () => {
  it('happy path: settling → effects → settled (marker last)', async () => {
    const run = terminalRun({});
    await reserveLoadout(runIdOf(run), ['item-kit-cura']);
    const { deps, markers, store } = makeDeps();
    const done = await settleRun(run, deps);
    expect(done.status).toBe('settled');
    expect(markers.map((m) => m.status)).toEqual(['settling', 'settled']);
    expect(store.state.gold).toBe(10 + 42 + 15);
    // The reservation aggregate is cleared by the journal's release effect.
    expect(await reservedItemIds()).toEqual(new Set());
  });

  it('crash after intent: run stays settling, replay converges, no double effects', async () => {
    const run = terminalRun({});
    const first = makeDeps();
    first.deps.fault = { crashAfter: 'intent' };
    await expect(settleRun(run, first.deps)).rejects.toThrow('fault injection');
    // Intent persisted, effects NOT applied.
    expect(first.markers.map((m) => m.status)).toEqual(['settling']);
    expect(first.store.state.gold).toBe(10);

    // Replay — the settling run re-derives and converges.
    const replayRun = terminalRun({ settlement: first.markers[0] });
    const second = makeDeps();
    const done = await settleRun(replayRun, second.deps);
    expect(done.status).toBe('settled');
    expect(second.store.state.gold).toBe(10 + 42 + 15);
  });

  it('crash after effects, before settled: replay skips applied keys — gold once', async () => {
    const run = terminalRun({});
    const shared = { state: minimalState({}) };
    const markers: SettlementMarker[] = [];
    const deps = {
      persistRun: (m: SettlementMarker) => void markers.push(m),
      applyToStore: (p: SettlementPlan) => {
        shared.state = applyPlanToState(shared.state, p, 200).next;
      },
      releaseLoadout,
      nowTick: () => 200,
      fault: { crashAfter: 'effects' as const },
    };
    await expect(settleRun(run, deps)).rejects.toThrow('fault injection');
    // Effects landed, marker stuck at settling.
    expect(markers.map((m) => m.status)).toEqual(['settling']);
    expect(shared.state.gold).toBe(10 + 42 + 15);

    // Replay over the SAME store aggregate: ledger dedups, marker converges.
    const replayRun = terminalRun({ settlement: markers[0] });
    deps.fault = undefined;
    const done = await settleRun(replayRun, deps);
    expect(done.status).toBe('settled');
    expect(shared.state.gold).toBe(10 + 42 + 15); // not doubled
    expect(markers.map((m) => m.status)).toEqual(['settling', 'settled']);
  });

  it('crash→replay→crash converges to the same terminal state', async () => {
    const run = terminalRun({});
    const shared = { state: minimalState({}) };
    const markers: SettlementMarker[] = [];
    const deps = {
      persistRun: (m: SettlementMarker) => void markers.push(m),
      applyToStore: (p: SettlementPlan) => {
        shared.state = applyPlanToState(shared.state, p, 200).next;
      },
      releaseLoadout,
      nowTick: () => 200,
      fault: { crashAfter: 'effects' as const },
    };
    // crash → replay → crash again (a second process restart mid-settle)
    await expect(settleRun(run, deps)).rejects.toThrow('fault injection');
    const replay1 = terminalRun({ settlement: markers[markers.length - 1] });
    await expect(settleRun(replay1, deps)).rejects.toThrow('fault injection');
    const replay2 = terminalRun({ settlement: markers[markers.length - 1] });
    deps.fault = undefined;
    const done = await settleRun(replay2, deps);
    expect(done.status).toBe('settled');
    expect(shared.state.gold).toBe(10 + 42 + 15);
    expect(shared.state.residents.find((r) => r.id === 'hero-member')?.isInjured).toBe(true);
  });

  it('already-settled run is a no-op', async () => {
    const settled: SettlementMarker = {
      status: 'settled',
      plan: deriveSettlementPlan(terminalRun({})),
      atTick: 150,
    };
    const { deps, markers, store } = makeDeps();
    const out = await settleRun(terminalRun({ settlement: settled }), deps);
    expect(out).toBe(settled);
    expect(markers).toHaveLength(0);
    expect(store.state.gold).toBe(10);
  });
});
