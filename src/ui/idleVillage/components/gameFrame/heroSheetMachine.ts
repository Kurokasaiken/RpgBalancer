/**
 * heroSheetMachine — the pure state machine behind `HeroSheetPanel` (PLAN-032 SP-1,
 * artifact r003). Three states — `closed`, `intending` (hover/focus intent window),
 * `open` — where grace and retarget are timers carried *inside* `open` as data
 * (`pending`), never states of their own. `useHeroSheet` is the single transition
 * owner: it dispatches every event, arms the timers the state describes, and is the
 * only path the panels registry calls into.
 *
 * The machine is pure: no timers, no DOM, no telemetry here. Inputs come from the
 * roster rail delegation (`cardEnter`/`cardLeave`), the panel (`panelEnter`/`panelLeave`),
 * the timer firings (`intentFired`/`graceFired`/`retargetFired`), the registry
 * (`openRequest`/`toggleRequest`), the drag session (`dragStart`/`dragEnd`), and the
 * post-commit reconciliation (`reconcile`).
 */

/** How the sheet came on screen. `sticky` = menu/shortcut/registry — always bypasses `dismissedFor`. */
export type HeroSheetSource = 'hover' | 'focus' | 'sticky';
/** The channel a card event arrived on; `focus` is armed only on `:focus-visible` upstream. */
export type HeroSheetVia = 'hover' | 'focus';
/** Every way the sheet can close; also the telemetry payload of `hero_sheet_close`. */
export type HeroSheetCloseReason = 'esc' | 'x' | 'grace' | 'target_removed' | 'route' | 'toggle';

/** The timer `open` is waiting on. Grace lives inside `open` — it is not a state. */
export type HeroSheetPending = { kind: 'grace' } | { kind: 'retarget'; id: string };

interface HeroSheetBase {
  /** Card the player dismissed with Esc: auto hover/focus on it stays suppressed until
   *  a clearing edge (pointerleave / focusout / removal). Sticky always bypasses. */
  dismissedFor: string | null;
  /** Last card shown — the default target of a sticky open. */
  lastViewedId: string | null;
}

export interface HeroSheetClosedState extends HeroSheetBase {
  status: 'closed';
  /** True while a resident drag is in progress: no sheet may open. */
  dragging: boolean;
  /** Why the last open ended (telemetry reads it once, then it is stale — harmless). */
  lastCloseReason?: HeroSheetCloseReason;
}

export interface HeroSheetIntendingState extends HeroSheetBase {
  status: 'intending';
  targetId: string;
  via: HeroSheetVia;
  dragging: boolean;
}

export interface HeroSheetOpenState extends HeroSheetBase {
  status: 'open';
  targetId: string;
  source: HeroSheetSource;
  pinned: boolean;
  pending: HeroSheetPending | null;
  /** Resident drag in progress: timers frozen (nothing arms, nothing expires). */
  suspended: boolean;
}

export type HeroSheetState = HeroSheetClosedState | HeroSheetIntendingState | HeroSheetOpenState;

export type HeroSheetEvent =
  | { type: 'cardEnter'; id: string; via: HeroSheetVia }
  | { type: 'cardLeave'; id: string; via: HeroSheetVia }
  | { type: 'pointerDown' }
  | { type: 'panelEnter' }
  | { type: 'panelLeave' }
  | { type: 'intentFired' }
  | { type: 'graceFired' }
  | { type: 'retargetFired' }
  /** Sticky open (menu/shortcut/registry): the controller resolves the target id first. */
  | { type: 'openRequest'; id: string }
  /** Registry toggle: closes when open (reason `toggle`), sticky-opens when closed. */
  | { type: 'toggleRequest'; id: string }
  | { type: 'closeRequest'; reason: HeroSheetCloseReason }
  | { type: 'targetRemoved'; id: string }
  | { type: 'pinToggle' }
  /** Explicit prev/next: the controller resolves the DOM-order neighbour id. */
  | { type: 'nav'; dir: 'prev' | 'next'; id: string }
  | { type: 'dragStart' }
  | { type: 'dragEnd' }
  /**
   * Post-commit truth (elementFromPoint on the last pointer position):
   * `id` = card under the pointer, `onPanel` = pointer inside the sheet,
   * `targetPresent` = the open target still exists in the rail DOM,
   * `dismissedGone` = the `dismissedFor` card left the roster (clearing edge).
   * `pointerKnown` = the pointer position was resolvable (last move seen AND
   * `elementFromPoint` exists — jsdom lacks it): when false, the reconcile
   * only verifies target/dismissed existence and must not arm grace.
   * It may retarget (dwell-gated) or arm grace ONLY from `open` — it never
   * arms intent from `closed`/`intending`: only a real pointermove arms.
   */
  | { type: 'reconcile'; id: string | null; onPanel: boolean; targetPresent: boolean; dismissedGone: boolean; pointerKnown: boolean };

export const HERO_SHEET_INITIAL_STATE: HeroSheetState = {
  status: 'closed',
  dismissedFor: null,
  lastViewedId: null,
  dragging: false,
};

/** closed + the parts carried forward (`dismissedFor`, `lastViewedId`, close reason). */
const toClosed = (
  prev: HeroSheetBase & { dragging?: boolean },
  reason?: HeroSheetCloseReason,
  escTargetId?: string | null,
  dragging = false,
): HeroSheetClosedState => ({
  status: 'closed',
  dismissedFor: reason === 'esc' ? (escTargetId ?? prev.dismissedFor) : prev.dismissedFor,
  lastViewedId: prev.lastViewedId,
  dragging,
  lastCloseReason: reason ?? (prev as HeroSheetClosedState).lastCloseReason,
});

/** Fresh `open` state: never pinned, never suspended, nothing pending. */
const openNow = (targetId: string, source: HeroSheetSource, prev: HeroSheetBase): HeroSheetOpenState => ({
  status: 'open',
  targetId,
  source,
  pinned: false,
  pending: null,
  suspended: false,
  dismissedFor: prev.dismissedFor,
  lastViewedId: targetId,
});

const closedReducer = (state: HeroSheetClosedState, event: HeroSheetEvent): HeroSheetState => {
  switch (event.type) {
    case 'cardEnter':
      // Drag active or the dismissed card: suppression stands until a clearing edge.
      if (state.dragging || event.id === state.dismissedFor) return state;
      return { ...state, status: 'intending', targetId: event.id, via: event.via, dragging: false };
    case 'openRequest':
    case 'toggleRequest':
      return openNow(event.id, 'sticky', state);
    case 'dragStart':
      return { ...state, dragging: true };
    case 'dragEnd':
      return { ...state, dragging: false };
    case 'cardLeave':
    case 'targetRemoved':
      return event.id === state.dismissedFor ? { ...state, dismissedFor: null } : state;
    case 'reconcile':
      return event.dismissedGone && state.dismissedFor ? { ...state, dismissedFor: null } : state;
    default:
      return state;
  }
};

const intendingReducer = (state: HeroSheetIntendingState, event: HeroSheetEvent): HeroSheetState => {
  switch (event.type) {
    case 'cardEnter':
      if (event.id === state.targetId) return state;
      if (event.id === state.dismissedFor) return toClosed(state);
      return { ...state, targetId: event.id, via: event.via };
    case 'cardLeave':
      if (event.id === state.targetId) return toClosed(state);
      return event.id === state.dismissedFor ? { ...state, dismissedFor: null } : state;
    case 'pointerDown':
      // Click-assign must never open the sheet.
      return toClosed(state);
    case 'dragStart':
      return toClosed(state, undefined, null, true);
    case 'intentFired':
      return openNow(state.targetId, state.via, state);
    case 'openRequest':
    case 'toggleRequest':
      return openNow(event.id, 'sticky', state);
    case 'targetRemoved':
      if (event.id === state.targetId) return toClosed(state);
      return event.id === state.dismissedFor ? { ...state, dismissedFor: null } : state;
    case 'closeRequest':
      return toClosed(state, event.reason);
    case 'reconcile':
      return event.dismissedGone && state.dismissedFor ? { ...state, dismissedFor: null } : state;
    default:
      return state;
  }
};

const openReducer = (state: HeroSheetOpenState, event: HeroSheetEvent): HeroSheetState => {
  switch (event.type) {
    case 'cardEnter': {
      if (state.suspended) return state;
      // Back on the shown card: whatever was pending is void.
      if (event.id === state.targetId) return state.pending ? { ...state, pending: null } : state;
      // The dismissed card stays suppressed until its own clearing edge.
      if (event.id === state.dismissedFor) return state;
      // Pinned: hovering only follows the roster (sticky-open default), never retargets.
      if (state.pinned) return { ...state, lastViewedId: event.id };
      return { ...state, pending: { kind: 'retarget', id: event.id } };
    }
    case 'cardLeave': {
      const dismissedFor = event.id === state.dismissedFor ? null : state.dismissedFor;
      // Leaving ANY card arms grace; leaving a retarget candidate aborts the dwell the
      // same way — re-entering something (target card, panel, other card) cancels it.
      return state.suspended
        ? dismissedFor === state.dismissedFor ? state : { ...state, dismissedFor }
        : { ...state, dismissedFor, pending: { kind: 'grace' } };
    }
    case 'panelEnter':
      return state.pending ? { ...state, pending: null } : state;
    case 'panelLeave':
      return state.suspended ? state : { ...state, pending: { kind: 'grace' } };
    case 'graceFired':
      return toClosed(state, 'grace');
    case 'retargetFired': {
      if (state.pending?.kind !== 'retarget') return state;
      return { ...state, targetId: state.pending.id, lastViewedId: state.pending.id, pending: null };
    }
    case 'pinToggle':
      return { ...state, pinned: !state.pinned };
    case 'nav':
      if (state.pinned) return state;
      return { ...state, targetId: event.id, lastViewedId: event.id, pending: null };
    case 'targetRemoved': {
      if (event.id === state.targetId) return toClosed(state, 'target_removed');
      return {
        ...state,
        dismissedFor: event.id === state.dismissedFor ? null : state.dismissedFor,
        lastViewedId: state.lastViewedId === event.id ? state.targetId : state.lastViewedId,
        // The candidate vanished mid-dwell: the pointer is in limbo — arm grace.
        pending: state.pending?.kind === 'retarget' && state.pending.id === event.id ? { kind: 'grace' } : state.pending,
      };
    }
    case 'openRequest':
      // Sticky retarget while open: same surface, new target, sticky source.
      return { ...state, targetId: event.id, source: 'sticky', lastViewedId: event.id, pending: null };
    case 'toggleRequest':
      return toClosed(state, 'toggle');
    case 'closeRequest':
      return toClosed(state, event.reason, event.reason === 'esc' ? state.targetId : null);
    case 'dragStart':
      // Timers suspended in place — the dragEnd reconcile decides arm/grace.
      return { ...state, suspended: true, pending: null };
    case 'dragEnd':
      return { ...state, suspended: false };
    case 'reconcile': {
      const dismissedFor = event.dismissedGone ? null : state.dismissedFor;
      if (state.suspended) return dismissedFor === state.dismissedFor ? state : { ...state, dismissedFor };
      if (!event.targetPresent) return toClosed(state, 'target_removed');
      if (!event.pointerKnown) return dismissedFor === state.dismissedFor ? state : { ...state, dismissedFor };
      if (event.id && event.id !== state.targetId && event.id !== dismissedFor) {
        // Pointer now rests on another card: dwell-gated retarget (or, pinned, just follow).
        if (state.pinned) return { ...state, dismissedFor, lastViewedId: event.id };
        return { ...state, dismissedFor, pending: { kind: 'retarget', id: event.id } };
      }
      // On the panel, on the shown card, or on the dismissed card: stand still.
      if (event.onPanel || event.id !== null) return { ...state, dismissedFor, pending: null };
      return { ...state, dismissedFor, pending: { kind: 'grace' } };
    }
    default:
      return state;
  }
};

/** Single transition owner: every event lands here. */
export function heroSheetReducer(state: HeroSheetState, event: HeroSheetEvent): HeroSheetState {
  switch (state.status) {
    case 'closed':
      return closedReducer(state, event);
    case 'intending':
      return intendingReducer(state, event);
    case 'open':
      return openReducer(state, event);
  }
}
