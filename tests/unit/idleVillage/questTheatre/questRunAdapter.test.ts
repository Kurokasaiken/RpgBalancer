/**
 * questRunAdapter — the real-runtime theatre producer (PLAN-025 T-006).
 *
 * Fixtures are driven through the REAL engine (createRun + submitCommand,
 * fixed seeds) so the projection is exercised on states the game actually
 * produces: choice frontiers with check previews, a pending ambush chain,
 * live combat, a multi-death toll, the bag, and terminal outcomes.
 */
import { describe, expect, it } from 'vitest';
import {
  createRun,
  matureReady,
  submitCommand,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import {
  createQuestRunAdapter,
  snapshotQuestRun,
  THEATRE_CONTRACT_VERSION,
} from '@/ui/idleVillage/questTheatre/questRunAdapter';
import type { TheatreIntent } from '@/ui/idleVillage/questTheatre/theatreContract';

const TICKS = 100;
const PARTY = GOBLIN_PRESETS[0].id;

const timedRun = (seed = 42) =>
  createRun(PARTY, seed, 'goblin', undefined, { nodeTicks: TICKS, startTick: 0 });

/** Park the run on a node as a waiting frontier (visited history kept honest). */
const atChoice = (state: QuestRunState, nodeId: string, tick = 0) => {
  state.nodeId = nodeId;
  state.visitedNodes.push(nodeId);
  state.frontier = { status: 'waiting', startedAt: tick, readyAt: tick };
};

const intent = (over: Partial<TheatreIntent> & { kind: TheatreIntent['kind'] }): TheatreIntent => ({
  commandId: 'cmd-1',
  nodeId: 'x',
  expectedFrontierVersion: 0,
  ...over,
} as TheatreIntent);

describe('questRunAdapter — projection', () => {
  it('a fresh run projects one awaitingPlayer node with options, previews and the bag', () => {
    const run = timedRun();
    const view = snapshotQuestRun(run, { tick: 5 });
    expect(view.contractVersion).toBe(THEATRE_CONTRACT_VERSION);
    expect(view.runState).toBe('running');
    expect(view.tick).toBe(5);
    expect(view.nodes).toHaveLength(1);
    const cur = view.nodes[0];
    expect(cur.state).toBe('awaitingPlayer');
    expect(cur.kind).toBe('choice');
    expect(cur.options!.length).toBeGreaterThan(0);
    // Default loadout packs stash items — flags → bag, not spent.
    expect(view.bag!.length).toBeGreaterThan(0);
    expect(view.party).toHaveLength(4);
    expect(view.party.every((m) => m.state === 'alive' && m.hp === m.maxHp)).toBe(true);
    // Advance to a check-rolling decision: previews are runtime-provided.
    submitCommand(run, 'gob-partenza', { tick: 0 });
    const next = snapshotQuestRun(run).nodes.at(-1);
    expect(next?.state).toBe('awaitingPlayer');
    expect(next?.options?.some((o) => (o.checkPreview?.probabilityPct ?? 0) > 0)).toBe(true);
  });

  it('resolved nodes come from traversal history, never from the graph', () => {
    const run = timedRun();
    submitCommand(run, 'gob-partenza', { tick: 0 });
    submitCommand(run, 'gob-cerca-tracce', { tick: 10 });
    const view = snapshotQuestRun(run);
    // visited: inizio → esplora → check → routed choice
    expect(view.nodes.map((n) => n.nodeId)).toEqual(run.visitedNodes);
    expect(view.nodes.slice(0, -1).every((n) => n.state === 'resolved')).toBe(true);
    const cur = view.nodes[view.nodes.length - 1];
    expect(cur.state).toBe('awaitingPlayer');
    // Nothing past the frontier leaks: no gob-agguato, no gob-fine.
    expect(view.nodes.some((n) => n.nodeId === 'gob-agguato' || n.nodeId === 'gob-fine')).toBe(false);
  });

  it('a pending frontier projects the timed node with readyAt and NO options', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    submitCommand(run, 'gob-fermati', { tick: 0 });
    const view = snapshotQuestRun(run, { tick: 40 });
    const cur = view.nodes[view.nodes.length - 1];
    expect(cur.nodeId).toBe('gob-ritorno');
    expect(cur.kind).toBe('timed');
    expect(cur.state).toBe('pending');
    expect(cur.pending).toEqual({ startedAt: 0, readyAt: TICKS });
    expect(cur.options).toBeUndefined();
    // The relief scene is readable before the ambush hits (E6).
    expect(cur.text).toContain('fischiettare');
  });

  it('live combat exposes turn + enemies telemetry and the fight-turn decision', () => {
    const run = timedRun();
    atChoice(run, 'gob-combattimento');
    // Teleport skips arriveNode's combat init — the horde stands.
    run.goblinLeft = 5;
    submitCommand(run, 'fight-turn', { tick: 0 });
    const view = snapshotQuestRun(run);
    const cur = view.nodes[view.nodes.length - 1];
    expect(cur.kind).toBe('combat');
    expect(cur.state).toBe('awaitingPlayer');
    expect(view.combat).toEqual({ turn: 1, enemiesLeft: run.goblinLeft });
    expect(cur.options!.some((o) => o.id === 'fight-turn')).toBe(true);
  });

  it('an ambush maturation lands a multi-death beat in the party strip', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    // Wound everyone so the flat ambush toll kills several members at once.
    run.party.forEach((m, i) => {
      m.hp = i === 0 ? m.maxHp : 4;
    });
    submitCommand(run, 'gob-fermati', { tick: 0 });
    matureReady(run, TICKS); // ritorno matures → agguato pending
    matureReady(run, 2 * TICKS); // agguato matures → harm lands
    const view = snapshotQuestRun(run);
    expect(view.party.filter((m) => m.state === 'dead').length).toBeGreaterThanOrEqual(2);
    expect(view.party[0].state).not.toBe('dead');
  });

  it('terminal outcomes map to theatre run states', () => {
    const wipe = timedRun();
    wipe.party.forEach((m) => (m.hp = 1, m.dead = true));
    wipe.ended = true;
    wipe.outcome = 'wipe';
    expect(snapshotQuestRun(wipe).runState).toBe('wiped');

    const clear = timedRun();
    atChoice(clear, 'gob-esplora-extra');
    clear.flags.push('sterminio');
    clear.objectiveDone = true;
    submitCommand(clear, 'gob-fermati', { tick: 0 });
    matureReady(clear, TICKS);
    expect(snapshotQuestRun(clear).runState).toBe('success');
  });

  it('same state → same snapshot (deterministic projection)', () => {
    const run = timedRun(7);
    submitCommand(run, 'gob-partenza', { tick: 0 });
    submitCommand(run, 'gob-cerca-tracce', { tick: 10 });
    expect(snapshotQuestRun(run, { tick: 20 })).toEqual(snapshotQuestRun(run, { tick: 20 }));
  });
});

describe('questRunAdapter — intents', () => {
  it('stale intents are rejected without touching the run', () => {
    const run = timedRun();
    const adapter = createQuestRunAdapter(() => run);
    const res = adapter.dispatch(
      intent({ kind: 'submitDecision', nodeId: 'gob-inizio', expectedFrontierVersion: 99, optionId: 'gob-partenza' }),
    );
    expect(res).toEqual({ status: 'rejected', reason: 'stale', message: 'snapshot scaduto' });
    expect(run.nodeId).toBe('gob-inizio');
  });

  it('the same commandId lands once — the replay is a duplicate', () => {
    const run = timedRun();
    const adapter = createQuestRunAdapter(() => run);
    const cmd = intent({
      kind: 'submitDecision',
      commandId: 'open-1',
      nodeId: run.nodeId,
      expectedFrontierVersion: run.frontierVersion,
      optionId: 'gob-partenza',
    });
    expect(adapter.dispatch(cmd)).toEqual({ status: 'accepted' });
    expect(run.nodeId).toBe('gob-esplora');
    // Double-fire (double click, reopen replay): rejected, no second advance.
    const again = adapter.dispatch({
      ...cmd,
      nodeId: 'gob-esplora',
      expectedFrontierVersion: run.frontierVersion,
    } as TheatreIntent);
    expect(again).toEqual({ status: 'rejected', reason: 'duplicate', message: 'comando già eseguito' });
    expect(run.nodeId).toBe('gob-esplora');
  });

  it('a pending frontier rejects decisions — only the clock crosses it', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    submitCommand(run, 'gob-fermati', { tick: 0 });
    const adapter = createQuestRunAdapter(() => run);
    const res = adapter.dispatch(
      intent({
        kind: 'submitDecision',
        nodeId: 'gob-ritorno',
        expectedFrontierVersion: run.frontierVersion,
        optionId: 'gob-fermati',
      }),
    );
    expect(res.status).toBe('rejected');
    expect(run.nodeId).toBe('gob-ritorno');
  });

  it('useItem potion heals and consumes; missing items are rejected honestly', () => {
    const run = timedRun();
    run.flags.push('hasPozione');
    run.party[1].hp = 10;
    run.party[1].wounded = true;
    const adapter = createQuestRunAdapter(() => run);
    const res = adapter.dispatch(
      intent({
        kind: 'useItem',
        commandId: 'potion-1',
        nodeId: run.nodeId,
        expectedFrontierVersion: run.frontierVersion,
        flag: 'hasPozione',
      }),
    );
    expect(res).toEqual({ status: 'accepted' });
    expect(run.flags).not.toContain('hasPozione');
    expect(run.party[1].hp).toBe(run.party[1].maxHp);
    // A check-modifier consumable is not an instant action.
    const armed = adapter.dispatch(
      intent({
        kind: 'useItem',
        commandId: 'bonus-1',
        nodeId: run.nodeId,
        expectedFrontierVersion: run.frontierVersion,
        flag: 'hasBonusForza',
      }),
    );
    expect(armed.status).toBe('rejected');
  });

  it('submitDecision passes the armed-consumable call to the engine', () => {
    const run = timedRun();
    run.flags.push('hasBonusPerc');
    const adapter = createQuestRunAdapter(() => run);
    adapter.dispatch(
      intent({ kind: 'submitDecision', nodeId: run.nodeId, expectedFrontierVersion: run.frontierVersion, optionId: 'gob-partenza' }),
    );
    adapter.dispatch(
      intent({
        kind: 'submitDecision',
        commandId: 'armed-check',
        nodeId: 'gob-esplora',
        expectedFrontierVersion: run.frontierVersion,
        optionId: 'gob-cerca-tracce',
        useConsumable: true,
      }),
    );
    // The check consumed the armed item exactly once.
    expect(run.flags).not.toContain('hasBonusPerc');
  });

  it('retreat and collectReward reject honestly — no synthesized commands', () => {
    const run = timedRun();
    const adapter = createQuestRunAdapter(() => run);
    for (const kind of ['retreat', 'collectReward'] as const) {
      const res = adapter.dispatch(
        intent({ kind, nodeId: run.nodeId, expectedFrontierVersion: run.frontierVersion }),
      );
      expect(res.status).toBe('rejected');
      expect(run.nodeId).toBe('gob-inizio');
    }
  });
});
