/**
 * questS1Lab/questRunStore — PLAN-040 T-003a: the run's external read store
 * and the check-overlay bridge channel.
 *
 * Why a store: the quest window and the quest overlays (skill check, outcome
 * toast) are SIBLINGS in the React tree — the overlays mount in
 * `#game-modal-root` so they are not React descendants of the draggable
 * window (debate r007 W-01r3: no synthetic-bubbling suppression needed, and
 * the window's drag transform can never trap a `position:fixed` layer). Both
 * surfaces therefore read run state through this store (Zustand +
 * `useSyncExternalStore` under the hood) instead of prop drilling.
 *
 * Channels:
 * - `runs[questId]` — the live `QuestRunState`, published by `useQuestRun`
 *   on every commit (the hook stays the single owner/mutator).
 * - `bridges[questId]` — the *presentation bridge* the beat-cursor owner
 *   (`QuestRunWindow`) publishes while it holds a check beat: what the
 *   external `QuestSkillCheckOverlay` should paint, plus the commands/events
 *   that flow between them (cursor skip on dismiss, resolve callback,
 *   imperative astrolabe handle).
 * - `rewardAck[questId]` — end-of-run acknowledgement: the reward popup
 *   stamps it on its first painted frame so the outcome-toast controller
 *   can hold the last unsettled outcome instead of predicting whether the
 *   report will render (debate2 W-20).
 */

import { create } from 'zustand';
import type { QuestRunState, ResolvedCheck, Verdict } from './questRun';
import { runIdOf } from '../quests/questSettlement';

/* ---- Event contract --------------------------------------------------- */

/**
 * The stable payload every check-overlay consumer works with (debate r007):
 * who/which-run a resolved check belongs to, its monotonic identities, and
 * the engine verdict. Anything outside this shape is stale or foreign.
 */
export interface QuestCheckEvent {
  /** `runIdOf(run)` — rejects events from a previous run sharing the quest. */
  runId: string;
  /** Run-scoped strictly monotonic resolution sequence. */
  checkSeq: number;
  /** Visit counter at resolution — settled iff `< run.cursorVisitSeq`. */
  visitSeq: number;
  /** Position within the committing action's batch (debug). */
  beatIndex: number;
  /** Engine verdict — presentation must not recompute it. */
  outcome: Verdict;
}

/** Builds the contract event for a check of `run`; `null` when `check` is absent. */
export function checkEventOf(run: QuestRunState, check: ResolvedCheck | undefined | null): QuestCheckEvent | null {
  if (!check) return null;
  return {
    runId: runIdOf(run),
    checkSeq: check.checkSeq,
    visitSeq: check.visitSeq,
    beatIndex: check.beatIndex,
    outcome: check.verdict,
  };
}

/**
 * Stale-event rejection (debate r007): an event is only actionable while its
 * run is the CURRENT run object and its sequence has not already passed the
 * dismissed high-water mark. Cross-run events and already-dismissed or
 * already-settled sequences are rejected.
 */
export function isStaleCheckEvent(evt: QuestCheckEvent, run: QuestRunState | null | undefined): boolean {
  if (!run) return true;
  if (evt.runId !== runIdOf(run)) return true;
  if (!Number.isInteger(evt.checkSeq) || evt.checkSeq <= 0) return true;
  if (evt.checkSeq <= run.dismissedUpTo) return true;
  return false;
}

/* ---- Presentation bridge ---------------------------------------------- */

/**
 * Imperative commands the overlay fills in on mount and the beat-cursor owner
 * invokes — `skipToResult` fast-forwards the spin, `throwNow` fires the armed
 * throw (skipIntro). Deferred until the overlay confirms its mount (debate
 * W-08): callers must tolerate a still-null handle.
 */
export interface QuestCheckOverlayHandle {
  skipToResult: () => void;
  throwNow: () => void;
}

/**
 * What `QuestRunWindow` publishes while a check beat is held on stage: the
 * engine check to paint, the forced astrolabe mode, and the callbacks the
 * overlay reports back through. `handle` is the overlay→window command slot
 * (the overlay assigns `handle.current` on mount, clears on unmount).
 */
export interface QuestCheckBridge {
  /** Beat id of the held check — dismissal is a no-op on any other beat. */
  beatId: string;
  check: ResolvedCheck;
  /** Forced presentation mode the overlay must paint (engine already resolved). */
  mode: 'bigwin' | 'win' | 'almost' | 'fail' | 'epicfail' | 'fail_wound' | 'fail_dead';
  /** skipIntro: the overlay throws itself right after mount. */
  autoThrow: boolean;
  /** Imperative slot filled by the overlay (skipToResult/throwNow). */
  handle: { current: QuestCheckOverlayHandle | null };
  /** Overlay → owner: the astrolabe painted the verdict (start the dwell). */
  onResolved: (beatId: string) => void;
  /** Overlay → owner: player dismissed the verdict — settle the held beat. */
  onDismiss: (beatId: string) => void;
}

/* ---- Store ------------------------------------------------------------- */

interface QuestRunStoreState {
  runs: Record<string, QuestRunState | null>;
  bridges: Record<string, QuestCheckBridge | null>;
  /** questId → runId whose reward popup has painted its first frame. */
  rewardAck: Record<string, string>;
}

export const useQuestRunStore = create<QuestRunStoreState>(() => ({
  runs: {},
  bridges: {},
  rewardAck: {},
}));

/** Called by `useQuestRun` on every committed run state (and on unmount/clear). */
export function publishQuestRun(questId: string, run: QuestRunState | null): void {
  useQuestRunStore.setState((s) =>
    (s.runs[questId] ?? null) === run ? s : { ...s, runs: { ...s.runs, [questId]: run } },
  );
}

/** Called by the beat-cursor owner when a check beat is held/cleared. */
export function publishCheckBridge(questId: string, bridge: QuestCheckBridge | null): void {
  useQuestRunStore.setState((s) =>
    (s.bridges[questId] ?? null) === bridge ? s : { ...s, bridges: { ...s.bridges, [questId]: bridge } },
  );
}

/** Reward-popup acknowledgement: stamps the runId whose report painted. */
export function markRewardShown(questId: string, runId: string): void {
  useQuestRunStore.setState((s) => ({ ...s, rewardAck: { ...s.rewardAck, [questId]: runId } }));
}

/** Selector hook — the overlays subscribe to exactly the run they project. */
export function useQuestRunFromStore(questId: string): QuestRunState | null {
  return useQuestRunStore((s) => s.runs[questId] ?? null);
}

/** Selector hook — the presentation bridge the owner published, if any. */
export function useCheckBridge(questId: string): QuestCheckBridge | null {
  return useQuestRunStore((s) => s.bridges[questId] ?? null);
}

/** Selector hook — the runId whose reward popup painted its first frame. */
export function useRewardAck(questId: string): string | null {
  return useQuestRunStore((s) => s.rewardAck[questId] ?? null);
}
