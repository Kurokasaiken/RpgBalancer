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
  beginSettlement,
  commitSettlement,
  deriveSettlementPlan,
  runIdOf,
  settleRun,
  settlementResourceDelta,
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
    loot: ['goblin trophy'],
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
  // INV:CTR-game-009.INV-3
  // INV:quest-settlement.INV-1
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

  // INV:CTR-game-009.INV-3
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

  // INV:CTR-game-009.INV-3
  it('fled: obiettivo perso in fuga → no reward, bottino in mano conservato', () => {
    const plan = deriveSettlementPlan(terminalRun({ outcome: 'fled', objectiveDone: false }));
    expect(plan.effects.some((e) => e.key === 'reward:village-gold')).toBe(false);
    const gold = plan.effects.filter((e) => e.kind === 'village-gold').reduce((s, e) => s + (e.amount ?? 0), 0);
    expect(gold).toBe(15); // solo run.gold — il trofeo/rewardResolved non paga
  });

  // INV:CTR-game-009.INV-3
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
  // INV:CTR-game-009.INV-3
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

  // INV:CTR-game-009.INV-3
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
/* R-186 T-0 — characterization of resident consequences               */
/* (wound max-semantics, dead guards, declared injuredUntilTick delta)  */
/* ------------------------------------------------------------------ */

describe('resident consequences characterization (R-186)', () => {
  const planWith = (effects: SettlementPlan['effects']): SettlementPlan => ({
    runId: 'run-char',
    questId: 'q',
    outcome: 'test',
    leaderAlive: true,
    objectiveDone: true,
    effects,
  });

  it('wound on wounded: recovery keeps the LONGER timer (max semantics)', () => {
    const state = minimalState({});
    const longer = applyPlanToState(state, planWith([
      { key: 'w:long', kind: 'resident-wounded', residentId: 'hero-leader', durationTicks: 30 },
    ]), 100).next;
    expect(longer.residents[0].injuredUntilTick).toBe(130);
    /* A shorter re-wound must not shorten the existing recovery. */
    const shorter = applyPlanToState(longer, planWith([
      { key: 'w:short', kind: 'resident-wounded', residentId: 'hero-leader', durationTicks: 2 },
    ]), 110).next;
    expect(shorter.residents[0].injuredUntilTick).toBe(130);
    /* A longer one extends past it. */
    const extended = applyPlanToState(shorter, planWith([
      { key: 'w:longer', kind: 'resident-wounded', residentId: 'hero-leader', durationTicks: 50 },
    ]), 110).next;
    expect(extended.residents[0].injuredUntilTick).toBe(160);
  });

  it('wound falls back to config woundRecoveryTicks; per-effect durationTicks overrides it', () => {
    const state = minimalState({});
    const flat = applyPlanToState(state, planWith([
      { key: 'w:flat', kind: 'resident-wounded', residentId: 'hero-leader' },
    ]), 100).next;
    expect(flat.residents[0].injuredUntilTick).toBe(100 + QUEST_SETTLEMENT.woundRecoveryTicks);
    const tiered = applyPlanToState(state, planWith([
      { key: 'w:tier', kind: 'resident-wounded', residentId: 'hero-leader', durationTicks: 7 },
    ]), 100).next;
    expect(tiered.residents[0].injuredUntilTick).toBe(107);
  });

  it('wound on a dead resident is a no-op', () => {
    const state = minimalState({
      residents: [
        { id: 'hero-leader', name: 'L', isWorking: false, isInjured: false, isDead: true, fatigue: 0 } as never,
      ],
    });
    const next = applyPlanToState(state, planWith([
      { key: 'w:dead', kind: 'resident-wounded', residentId: 'hero-leader' },
    ]), 100).next;
    expect(next.residents[0].isInjured).toBe(false);
    expect(next.residents[0].injuredUntilTick).toBeUndefined();
  });

  it('death on a wounded resident clears the wound fields (declared R-186 delta)', () => {
    /* Contract (gameplayTypes.ts:20): «the wound fields are cleared» —
     * injuredUntilTick must be reset too, not just isInjured. */
    const state = minimalState({
      residents: [
        { id: 'hero-leader', name: 'L', isWorking: true, isInjured: true, injuredUntilTick: 999, fatigue: 0 } as never,
      ],
    });
    const next = applyPlanToState(state, planWith([
      { key: 'd:0', kind: 'resident-dead', residentId: 'hero-leader' },
    ]), 100).next;
    const r = next.residents[0];
    expect(r.isDead).toBe(true);
    expect(r.isInjured).toBe(false);
    expect(r.isWorking).toBe(false);
    expect(r.injuredUntilTick).toBeUndefined();
  });

  it('resident-xp is a guarded delta and does not touch health fields', () => {
    const state = minimalState({
      residents: [
        { id: 'hero-leader', name: 'L', isWorking: false, isInjured: false, fatigue: 0, xp: 5 } as never,
      ],
    });
    const next = applyPlanToState(state, planWith([
      { key: 'xp:1', kind: 'resident-xp', residentId: 'hero-leader', amount: 3 },
    ]), 100).next;
    expect(next.residents[0].xp).toBe(8);
    expect(next.residents[0].isInjured).toBe(false);
    expect(next.residents[0].isDead).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* eventLog (PLAN-019-S4 T-1) — the village remembers the run           */
/* ------------------------------------------------------------------ */

describe('eventLog', () => {
  it('writes an outcome headline plus one line per applied effect', () => {
    const plan = deriveSettlementPlan(terminalRun({}), { questTitle: 'Goblin Extermination' });
    const { next } = applyPlanToState(minimalState({}), plan, 200);
    const log = next.eventLog ?? [];
    /* Entries: outcome + wounded(hero-member) + goldReward(42) + goldLoot(15)
     * + xp(3) + R-183 residentXp × 2 survivors — loadout-release stays silent. */
    expect(log).toHaveLength(7);

    const headline = log[0];
    expect(headline.type).toBe('quest_outcome');
    expect(headline.severity).toBe('success'); // outcome=reward
    expect(headline.messageKey).toBe('gameFrame.questLog.outcome.reward');
    expect(headline.messageParams).toEqual({ quest: 'Goblin Extermination' });
    expect(headline.id).toBe(`${plan.runId}:log:outcome`);

    const wounded = log[1];
    expect(wounded.type).toBe('quest_settlement');
    expect(wounded.severity).toBe('warning');
    expect(wounded.residentId).toBe('hero-member');
    expect(wounded.messageKey).toBe('gameFrame.questLog.residentWounded');
    expect(wounded.messageParams).toEqual({ name: 'Member' });

    expect(log[2].messageKey).toBe('gameFrame.questLog.goldReward');
    expect(log[2].messageParams).toEqual({ amount: 42, quest: 'Goblin Extermination' });
    expect(log[3].messageKey).toBe('gameFrame.questLog.goldLoot');
    expect(log[3].messageParams).toEqual({ amount: 15, quest: 'Goblin Extermination' });
    expect(log[4].messageKey).toBe('gameFrame.questLog.xp');
    expect(log[5].messageKey).toBe('gameFrame.questLog.residentXp');
    expect(log[5].messageParams).toEqual({ name: 'Leader', amount: 3, quest: 'Goblin Extermination' });
    expect(log[6].messageParams).toEqual({ name: 'Member', amount: 3, quest: 'Goblin Extermination' });
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
    expect(next.eventLog?.[99].messageKey).toBe('gameFrame.questLog.residentXp');
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

/* ------------------------------------------------------------------ */
/* R-260 collect-commit — begin persists the intent, the report's        */
/* dismissal owns the mutation.                                          */
/* ------------------------------------------------------------------ */

describe('R-260 begin/commit split', () => {
  // INV:quest-settlement.INV-2
  it('begin persists `settling` and freezes the plan WITHOUT touching the aggregate', async () => {
    const run = terminalRun({});
    const { deps, markers, store } = makeDeps();
    const released: string[] = [];
    deps.releaseLoadout = (runId) => void released.push(runId);

    const marker = await beginSettlement(run, deps);
    expect(marker.status).toBe('settling');
    expect(marker.plan.runId).toBe(runIdOf(run));
    expect(markers.map((m) => m.status)).toEqual(['settling']);
    /* The collect-commit boundary: arrival/acknowledgement moves nothing —
     *  gold, xp and the loadout release all wait for the dismissal. */
    expect(store.state.gold).toBe(10);
    expect(store.state.xp).toBe(0);
    expect(store.state.appliedQuestEffectIds ?? []).toHaveLength(0);
    expect(released).toHaveLength(0);
  });

  // INV:quest-settlement.INV-2
  it('commit on a `settling` run applies the frozen plan and lands `settled`', async () => {
    const run = terminalRun({});
    const { deps, markers, store } = makeDeps();
    const intent = await beginSettlement(run, deps);
    const settlingRun = terminalRun({ settlement: intent });

    const done = await commitSettlement(settlingRun, deps);
    expect(done.status).toBe('settled');
    expect(done.plan).toBe(intent.plan); // the frozen plan commits, not a re-derived one
    expect(store.state.gold).toBe(10 + 42 + 15);
    expect(store.state.xp).toBe(3);
    expect(markers.map((m) => m.status)).toEqual(['settling', 'settled']);
  });

  // INV:quest-settlement.INV-2
  it('commit on an unmarked run still pays out — begin is implicit, never required', async () => {
    const run = terminalRun({});
    const { deps, markers, store } = makeDeps();
    const done = await commitSettlement(run, deps);
    expect(done.status).toBe('settled');
    expect(markers.map((m) => m.status)).toEqual(['settling', 'settled']);
    expect(store.state.gold).toBe(10 + 42 + 15);
  });

  // INV:quest-settlement.INV-2
  it('begin then commit then commit again — the grant lands once', async () => {
    const run = terminalRun({});
    const { deps, store } = makeDeps();
    const intent = await beginSettlement(run, deps);
    const settlingRun = terminalRun({ settlement: intent });
    const done = await commitSettlement(settlingRun, deps);
    const again = await commitSettlement(terminalRun({ settlement: done }), deps);
    expect(again).toBe(done);
    expect(store.state.gold).toBe(10 + 42 + 15); // not doubled
  });

  // INV:quest-settlement.INV-2
  it('settlementResourceDelta derives the village grant from the frozen plan', () => {
    const plan = deriveSettlementPlan(terminalRun({}));
    expect(settlementResourceDelta(plan)).toEqual({ gold: 42 + 15, xp: 3 });
    /* Wipe pays nothing — the delta reports zero, no chip. */
    const wipe = deriveSettlementPlan(
      terminalRun({
        outcome: 'wipe',
        objectiveDone: false,
        gold: 0,
        xp: 0,
        party: [
          { id: 'hero-leader', name: 'L', stats: {}, role: 'leader', hp: 0, maxHp: 100, wounded: false, dead: true },
        ],
      }),
    );
    expect(settlementResourceDelta(wipe)).toEqual({ gold: 0, xp: 0 });
  });
});
