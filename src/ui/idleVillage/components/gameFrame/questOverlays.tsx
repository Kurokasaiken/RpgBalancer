/**
 * questOverlays — PLAN-040 T-003a: the shared overlay host for the running
 * quest, mounted as a SIBLING of `QuestRunWindow` (never its React
 * descendant) inside `#game-modal-root` under `document.body`.
 *
 * Why a portal root: the window's drag writes a `transform` on its shell and
 * a transformed ancestor turns `position:fixed` into absolute — any overlay
 * rendered inside it would be dragged along and could never cover the
 * viewport correctly. Mounting here also means no synthetic-bubbling
 * suppression is needed: the window's click-to-advance handlers live on
 * nodes the overlay is not a React child of, and document-level listeners
 * (Escape stack, outside-click, telemetry) keep receiving every event.
 *
 * Contents:
 * - `ensureGameModalRoot` — lazily creates the host element; both `/game`
 *   and `/quest-window-lab` share it through `<QuestOverlays>`.
 * - the overlay stack — registration order decides which overlay answers
 *   `Escape` (topmost only, debate r007); `useOverlayEscape` is the hook.
 * - `QuestOverlays` — reads the run + the check presentation bridge from
 *   `questRunStore` and portals the skill-check overlay in. The outcome
 *   toast joins this host in T-005 through the same stack.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { checkEventOf, isStaleCheckEvent, useCheckBridge, useQuestRunFromStore } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { QuestSkillCheckOverlay } from './QuestSkillCheckOverlay';
import { QuestOutcomeToastHost } from './QuestOutcomeToast';

/* The Escape stack lives in its own module — the overlay imports it without
 * a cycle back into this file. */
export { isTopmostOverlay, overlayStackSnapshot, useOverlayEscape } from './overlayStack';

/** Id of the shared host element the quest overlays portal into. */
export const GAME_MODAL_ROOT_ID = 'game-modal-root';

/**
 * Returns the shared modal-root element, creating it under `document.body`
 * when absent. `null` outside a DOM environment (SSR/tests) — callers must
 * tolerate that.
 */
export function ensureGameModalRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById(GAME_MODAL_ROOT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = GAME_MODAL_ROOT_ID;
    document.body.appendChild(el);
  }
  return el;
}

/* ---- Host component --------------------------------------------------- */

export interface QuestOverlaysProps {
  /** The quest this page's run belongs to — selects the store channel. */
  questId: string;
  /** Durable dismissal path for the outcome toast (`useQuestRun.dismissOutcome`)
   *  — raises the run's persisted `dismissedUpTo`. */
  onDismissOutcome?: (checkSeq: number) => void;
}

/**
 * Mounts every quest-level overlay inside `#game-modal-root`. Reads the run
 * and the presentation bridge the beat-cursor owner publishes — this host
 * never owns quest state, it projects it (debate r007: controller state is
 * per-domain UI only; the engine stays the single source of truth).
 */
export const QuestOverlays: React.FC<QuestOverlaysProps> = ({ questId, onDismissOutcome }) => {
  const [root] = useState(() => ensureGameModalRoot());
  const run = useQuestRunFromStore(questId);
  const bridge = useCheckBridge(questId);
  /* Stale/cross-run rejection (debate r007): the bridge must describe a
   * check of the CURRENT run — a leftover publication from a cleared or
   * restarted run paints nothing. `dismissedUpTo` sequences are stale too:
   * their outcome has already been surfaced. */
  const event = run && bridge ? checkEventOf(run, bridge.check) : null;
  const live = !!event && !isStaleCheckEvent(event, run);
  if (!root) return null;
  return createPortal(
    <>
      {run && bridge && live ? <QuestSkillCheckOverlay bridge={bridge} run={run} /> : null}
      <QuestOutcomeToastHost questId={questId} onDismissOutcome={onDismissOutcome} />
    </>,
    root,
  );
};

export default QuestOverlays;
