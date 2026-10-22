/**
 * questCollectCommit.test.tsx — R-260 collect-commit contract on the real
 * session boundary (PLAN-075): the report's lifecycle drives the settlement
 * journal, not the run's `ended` flag.
 *
 * Invarianti provate qui:
 *  - arrival alone moves nothing: an ended run without a painted report keeps
 *    the village gold/xp untouched and carries no settlement marker;
 *  - the report's first paint (rewardAck) persists `settling` — the frozen
 *    plan + the durable "shown" bit — still without applying effects;
 *  - the dismissal commits: `commitSettlement` applies gold/xp/consequences
 *    once, stamps `settled` and publishes the transient HUD delta;
 *  - a run hydrated with `settling` (report shown, dismissal lost to a
 *    reload) auto-commits on mount — no ceremony, no double grant.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import type { QuestRunApi } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { SettlementMarker } from '@/ui/idleVillage/quests/questSettlement';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/balancing/config/idleVillage/transformations', () => ({
  transformIdleVillageToMinimalConfig: () => DEFAULT_MINIMAL_CONFIG,
}));

vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: () => ({
    config: DEFAULT_IDLE_VILLAGE_CONFIG,
    history: [],
    initialized: true,
    isInitializing: false,
    initializeConfig: vi.fn(),
    saveConfig: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
    exportConfig: vi.fn(),
    importConfig: vi.fn(),
    resetConfig: vi.fn(),
    resetToInitialConfig: vi.fn(),
    updateConfig: vi.fn(),
  }),
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
  traceMinimalGameplay: vi.fn(),
}));

vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(() => Promise.resolve()),
  loadData: vi.fn(<T,>(_key: string, fallback: T) => Promise.resolve(fallback)),
  clearData: vi.fn(() => Promise.resolve()),
}));

import { useQuestExpeditionSession, type QuestExpeditionSession } from '@/ui/idleVillage/quests/useQuestExpeditionSession';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';
import { deriveSettlementPlan, runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import { markRewardShown, useQuestRunStore } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

/** A terminal run literal — only the fields the settlement path reads. */
const terminalRun = (over: Partial<QuestRunState>): QuestRunState =>
  ({
    seed: 7,
    rngCalls: 0,
    questId: 'goblin',
    presetId: 'test',
    nodeId: 'gob-end',
    party: [
      { id: 'cc-leader', name: 'Leader', stats: {}, role: 'leader', hp: 40, maxHp: 100, wounded: false, dead: false },
      { id: 'cc-member', name: 'Member', stats: {}, role: 'member', hp: 10, maxHp: 60, wounded: true, dead: false },
    ],
    gold: 15,
    days: 1,
    bottinoOro: 0,
    loot: [],
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
    launchedAtTick: 100,
    resolvedOffer: {
      offerSchemaVersion: 1,
      poiId: 'poi-goblin',
      questId: 'goblin',
      rewardResolved: 42,
      resolvedAtDay: 0,
    } as QuestRunState['resolvedOffer'],
    ...over,
  }) as QuestRunState;

/** A questRun stub whose `run` is mutable — `applySettlement` reproduces the
 *  real seam: it stamps the marker onto the live record, so the session's
 *  next read sees it (without React needing a re-render of this harness). */
const makeQuestRun = (initial: QuestRunState | null) => {
  const box: { current: QuestRunState | null } = { current: initial };
  const api: QuestRunApi = {
    get run() {
      return box.current;
    },
    phases: [],
    start: vi.fn(),
    choose: vi.fn(),
    armedFlags: new Set<string>(),
    toggleArmedFlag: vi.fn(),
    syncClock: vi.fn(),
    abandon: vi.fn(),
    useHealing: vi.fn(),
    drinkPotion: vi.fn(),
    clear: vi.fn(),
    beats: [],
    beatCursorRef: { current: 0 },
    applySettlement: vi.fn((marker: SettlementMarker) => {
      if (!box.current?.ended) return;
      /* The real seam's R-260 monotone guard: `settling` only lands on an
       *  unmarked run — the stub mirrors it so the tests exercise the same
       *  boundary, not a weaker double. */
      if (marker.status === 'settling' && box.current.settlement) return;
      box.current = { ...box.current, settlement: marker };
    }),
    dismissOutcome: vi.fn(),
  };
  return { api, box };
};

const Harness: React.FC<{ probe: { session: QuestExpeditionSession | null }; questRun: QuestRunApi }> = ({ probe, questRun }) => {
  const session = useQuestExpeditionSession({
    poi: questPoiById('poi-goblin')!,
    questRun,
    activeRuns: [questRun.run],
    currentTick: 0,
    onOpenStash: () => {},
  });
  probe.session = session;
  return <DndContext>{session.overlays}</DndContext>;
};

const goldOf = () => useMinimalGameplayStore.getState().state.gold;
const xpOf = () => useMinimalGameplayStore.getState().state.xp;

describe('quest expedition — collect-commit (R-260)', () => {
  beforeEach(() => {
    useQuestRunStore.setState({ rewardAck: {} });
    /* Resident ids are unique per test via the run id, so the shared store's
     *  applied-key ledger never dedups across cases. */
    useMinimalGameplayStore.setState((s) => ({
      state: { ...s.state, appliedQuestEffectIds: [] },
      resourceDelta: null,
    }));
  });

  // INV:use-quest-expedition-session.INV-3 — an ended run without a painted
  // report must NOT commit: the arrival is presentation, the dismissal is
  // the mutation.
  // INV:CTR-game-008.INV-5 — the settlement commit is bound to the report's
  // dismissal, never to `ended`.
  it('arrival alone commits nothing — no marker, no grant, no delta', async () => {
    const run = terminalRun({ scenarioInstanceId: 'qsi-cc-arrive' });
    const { api } = makeQuestRun(run);
    const probe: { session: QuestExpeditionSession | null } = { session: null };
    render(<Harness probe={probe} questRun={api} />);
    const goldBefore = goldOf();

    /* Give every effect a beat to fire — none may write. */
    await act(async () => {});
    expect(api.applySettlement).not.toHaveBeenCalled();
    expect(api.run?.settlement).toBeUndefined();
    expect(goldOf()).toBe(goldBefore);
    expect(useMinimalGameplayStore.getState().resourceDelta).toBeNull();
  });

  // INV:use-quest-expedition-session.INV-3 — the report's first painted
  // frame persists `settling` (frozen plan + durable "shown" bit) and still
  // leaves the aggregate untouched.
  it('the painted report persists `settling` — resources still unmoved', async () => {
    const run = terminalRun({ scenarioInstanceId: 'qsi-cc-begin' });
    const { api, box } = makeQuestRun(run);
    const probe: { session: QuestExpeditionSession | null } = { session: null };
    render(<Harness probe={probe} questRun={api} />);
    const goldBefore = goldOf();

    act(() => {
      markRewardShown('goblin', runIdOf(run));
    });

    await waitFor(() => expect(api.applySettlement).toHaveBeenCalled());
    expect(box.current?.settlement?.status).toBe('settling');
    expect(box.current?.settlement?.plan.runId).toBe(runIdOf(run));
    /* Intent persisted — nothing applied yet. */
    expect(goldOf()).toBe(goldBefore);
    expect(useMinimalGameplayStore.getState().resourceDelta).toBeNull();
  });

  // INV:use-quest-expedition-session.INV-3 — the dismissal commits: effects
  // once, marker settled, delta published for the HUD chip.
  it('the dismissal commits — gold/xp land once, marker settles, delta publishes', async () => {
    const run = terminalRun({ scenarioInstanceId: 'qsi-cc-commit' });
    const { api, box } = makeQuestRun(run);
    const probe: { session: QuestExpeditionSession | null } = { session: null };
    render(<Harness probe={probe} questRun={api} />);
    const goldBefore = goldOf();
    const xpBefore = xpOf();

    act(() => {
      markRewardShown('goblin', runIdOf(run));
    });
    await waitFor(() => expect(box.current?.settlement?.status).toBe('settling'));

    await act(async () => {
      await probe.session!.commitSettlement();
    });

    expect(box.current?.settlement?.status).toBe('settled');
    expect(goldOf()).toBe(goldBefore + 42 + 15);
    expect(xpOf()).toBe(xpBefore + 3);
    expect(useMinimalGameplayStore.getState().resourceDelta).toMatchObject({ gold: 57, xp: 3 });

    /* A second dismissal is a no-op — the grant never lands twice. */
    await act(async () => {
      await probe.session!.commitSettlement();
    });
    expect(goldOf()).toBe(goldBefore + 57);
  });

  // INV:use-quest-expedition-session.INV-3 — a `settling` marker at mount
  // means "report shown, dismissal lost" (reload mid-ceremony): auto-commit
  // through the same idempotent kernel, no ceremony.
  // INV:CTR-game-008.INV-5 — a hydrated `settling` run auto-commits at mount.
  it('hydrating a `settling` run auto-commits on mount', async () => {
    const base = terminalRun({ scenarioInstanceId: 'qsi-cc-replay' });
    const run = { ...base, settlement: { status: 'settling', plan: deriveSettlementPlan(base), atTick: 150 } } as QuestRunState;
    const { api, box } = makeQuestRun(run);
    const probe: { session: QuestExpeditionSession | null } = { session: null };
    const goldBefore = goldOf();

    render(<Harness probe={probe} questRun={api} />);

    await waitFor(() => expect(box.current?.settlement?.status).toBe('settled'));
    expect(goldOf()).toBe(goldBefore + 57);
    expect(useMinimalGameplayStore.getState().resourceDelta).toMatchObject({ gold: 57, xp: 3 });
  });

  // INV:use-quest-expedition-session.INV-3 — collect also works when the
  // painted ack never landed (e.g. closed before the rAF fired): the commit
  // begins implicitly rather than dropping the grant.
  it('a dismissal without a prior paint still commits', async () => {
    const run = terminalRun({ scenarioInstanceId: 'qsi-cc-fused' });
    const { api, box } = makeQuestRun(run);
    const probe: { session: QuestExpeditionSession | null } = { session: null };
    render(<Harness probe={probe} questRun={api} />);
    const goldBefore = goldOf();

    await act(async () => {
      await probe.session!.commitSettlement();
    });

    expect(box.current?.settlement?.status).toBe('settled');
    expect(goldOf()).toBe(goldBefore + 57);
  });
});
