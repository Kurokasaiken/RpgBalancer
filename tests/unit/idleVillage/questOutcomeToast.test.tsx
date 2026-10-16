/**
 * QuestOutcomeToast — PLAN-040 T-005: the eligibility predicate is exactly
 * "latest check with seq > dismissedUpTo AND no live bridge on that seq",
 * suppressed only by rewardShown acknowledgement (not predicted run-end),
 * and dismissal lowers nothing persistent unless the page forwards the write
 * path. Rendered against the real zustand store so the contract is tested at
 * the seam the page actually consumes.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { QuestOutcomeToastHost } from '@/ui/idleVillage/components/gameFrame/QuestOutcomeToast';
import {
  publishCheckBridge,
  publishQuestRun,
  useQuestRunStore,
  markRewardShown,
  type QuestCheckBridge,
} from '@/ui/idleVillage/questS1Lab/questRunStore';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { applyChoice, availableOptions, checkHistory, createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_ns: string, key: string) => key }),
}));

const QUEST_ID = 'goblin';
const PRESET = GOBLIN_PRESETS[0].id;
const TOAST_TIMEOUT_MS = DEFAULT_GAME_FRAME_CONFIG.questWindow.outcomeToast.rewardAckTimeoutMs;

/** Greedy run with at least one resolved check on history. */
const drivenRun = (): QuestRunState => {
  const run = createRun(PRESET, 42, QUEST_ID);
  for (let i = 0; i < 80 && !run.ended; i += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[0].id);
  }
  return run;
};

/** Publishes a run with a fabricated fully-labelled check appended to history.
 *  `ended` controls the pending-flush branch — the driven run ends naturally,
 *  so mid-run cases must clear it. */
const publishWithCheck = (check: Partial<ResolvedCheck>, opts: { ended?: boolean } = {}): { run: QuestRunState; check: ResolvedCheck } => {
  const run = drivenRun();
  const seq = (run.checkSeq ?? 0) + 1;
  const c: ResolvedCheck = {
    ...(checkHistory(run)[0] as ResolvedCheck),
    title: 'The bell wire',
    flavor: 'One wrong breath and the grove answers.',
    harmLines: ['Milo takes the thorn in the shoulder.'],
    ...check,
    checkSeq: seq,
    visitSeq: run.cursorVisitSeq - 1,
    beatIndex: 1,
  };
  run.checkSeq = seq;
  run.checkQueue = [...run.checkQueue, c];
  if (opts.ended) {
    run.ended = run.ended ?? ({ outcome: 'victory', endingId: 'e', nodesVisited: run.visitedNodes.length, endingText: [], verdict: 'success' } as unknown as QuestRunState['ended']);
  } else {
    run.ended = null;
  }
  publishQuestRun(QUEST_ID, run);
  return { run, check: c };
};

const bridgeFor = (check: ResolvedCheck): QuestCheckBridge => ({
  beatId: 'b1',
  check,
  mode: 'win',
  autoThrow: false,
  handle: { current: null },
  onResolved: vi.fn(),
  onDismiss: vi.fn(),
});

const toast = () => screen.queryByTestId('quest-outcome-toast');

describe('QuestOutcomeToast — PLAN-040 T-005', () => {
  beforeEach(() => {
    vi.useRealTimers();
    useQuestRunStore.setState({ runs: {}, bridges: {}, rewardAck: {} });
  });

  it('renders the latest eligible check with title, flavor and harm lines — everything at once', () => {
    publishWithCheck({});
    render(<QuestOutcomeToastHost questId={QUEST_ID} />);
    expect(toast()).not.toBeNull();
    expect(toast()!.getAttribute('role')).toBe('status');
    expect(toast()!.textContent).toContain('The bell wire');
    expect(toast()!.textContent).toContain('One wrong breath and the grove answers.');
    expect(toast()!.textContent).toContain('Milo takes the thorn in the shoulder.');
  });

  it('a live bridge on the same checkSeq hides the toast (overlay owns the truth)', () => {
    const { run, check } = publishWithCheck({});
    /* Older resolved checks would legitimately be eligible latest-wins;
     * absorb them so the fabricated one is the only candidate. */
    run.dismissedUpTo = check.checkSeq - 1;
    publishQuestRun(QUEST_ID, run);
    publishCheckBridge(QUEST_ID, bridgeFor(check));
    render(<QuestOutcomeToastHost questId={QUEST_ID} />);
    expect(toast()).toBeNull();
  });

  it('latest-wins: only the highest eligible seq renders', () => {
    const { run, check: older } = publishWithCheck({});
    const newer: ResolvedCheck = { ...older, checkSeq: older.checkSeq + 1, title: 'Newer resolution' };
    run.checkSeq = newer.checkSeq;
    run.checkQueue = [...run.checkQueue, newer];
    publishQuestRun(QUEST_ID, run);
    render(<QuestOutcomeToastHost questId={QUEST_ID} />);
    expect(toast()!.textContent).toContain('Newer resolution');
    expect(toast()!.textContent).not.toContain('The bell wire');
  });

  it('click dismisses and forwards the persisted write path (dismissedUpTo)', () => {
    const { check } = publishWithCheck({});
    const onDismiss = vi.fn();
    render(<QuestOutcomeToastHost questId={QUEST_ID} onDismissOutcome={onDismiss} />);
    fireEvent.click(toast()!);
    expect(onDismiss).toHaveBeenCalledWith(check.checkSeq);
    /* Same session: stays hidden even if the persisted write lags a commit. */
    expect(toast()).toBeNull();
  });

  it('an ended run holds the toast until the reward popup acknowledges — or the timeout', () => {
    vi.useFakeTimers();
    const { run } = publishWithCheck({}, { ended: true });
    const runId = runIdOf(run);
    render(<QuestOutcomeToastHost questId={QUEST_ID} />);
    expect(toast()).toBeNull();
    /* Reward acks on its first painted frame → toast never shows. */
    act(() => { markRewardShown(QUEST_ID, runId); });
    act(() => { vi.advanceTimersByTime(TOAST_TIMEOUT_MS + 1); });
    expect(toast()).toBeNull();
  });

  it('an ended run without reward ack flushes the toast after the timeout', () => {
    vi.useFakeTimers();
    publishWithCheck({}, { ended: true });
    render(<QuestOutcomeToastHost questId={QUEST_ID} />);
    act(() => { vi.advanceTimersByTime(TOAST_TIMEOUT_MS - 10); });
    expect(toast()).toBeNull();
    act(() => { vi.advanceTimersByTime(20); });
    expect(toast()).not.toBeNull();
  });
});
