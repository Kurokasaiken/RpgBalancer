/**
 * useDragOutcome — single source of truth for the drag outcome state machine.
 *
 * Every drag surface (SlotPage, rosterKit, SlotRack, POI pages) must drive its
 * visual feedback through this hook instead of re-implementing the transitions.
 * States:
 *
 *   idle → dragging → flight    (valid drop: token flies into the slot)
 *                   → returning (invalid drop: spring-back to origin)
 *   flight/returning → idle     (automatic, after the animation completes)
 *
 * The `returning` state MUST be reset to `idle` when the bounce-spring
 * animation ends, otherwise the PgCard stays semi-transparent and
 * non-interactive forever (historical bug on /slot).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/** Duration of PgCard's `animate-bounce-spring` (see PgCard returningOverlayClass). */
export const SPRING_BACK_MS = 600;

export interface FlightCoords {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export type DragOutcomeState =
  | { mode: 'idle' }
  | { mode: 'dragging'; residentId: string }
  | ({ mode: 'flight'; residentId: string; slotId: string; isInset: boolean } & FlightCoords)
  | { mode: 'returning'; residentId: string };

export interface StartFlightParams {
  residentId: string;
  slotId: string;
  isInset: boolean;
  toX: number;
  toY: number;
  /** Origin of the flight. When omitted, resolved automatically from the last
   * pointer release position (tracked by CustomDragOverlay). */
  fromX?: number;
  fromY?: number;
}

/**
 * Where a flight should start when the caller doesn't say otherwise: the actual
 * pointer release position (written by CustomDragOverlay on every
 * pointermove/pointerup), falling back to the given point or screen center.
 */
export function resolveFlightOrigin(fallback?: { x: number; y: number }): { x: number; y: number } {
  const lastPos = (window as Window & { __lastDragPosition?: { x: number; y: number } }).__lastDragPosition;
  return lastPos ?? fallback ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

export interface DragOutcomeApi {
  state: DragOutcomeState;
  /** Call on drag start. */
  startDrag: (residentId: string) => void;
  /** Valid drop: launch the flight animation toward the slot. Caller applies the
   * assignment in the flight `onComplete` (or immediately if it has no proxy).
   * `fromX/fromY` are optional: by default the flight starts from the actual
   * pointer release position. */
  startFlight: (params: StartFlightParams) => void;
  /** Invalid drop: spring-back, then automatically reset to idle after SPRING_BACK_MS. */
  springBack: (residentId: string) => void;
  /** Return to idle (e.g. after the flight completes or a drag is cancelled). */
  settle: () => void;
}

export function useDragOutcome(): DragOutcomeApi {
  const [state, setState] = useState<DragOutcomeState>({ mode: 'idle' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      // eslint-disable-next-line no-restricted-globals
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const startDrag = useCallback((residentId: string) => {
    clearTimer();
    (window as Window & { __dragFlightActive?: boolean }).__dragFlightActive = false;
    setState({ mode: 'dragging', residentId });
  }, [clearTimer]);

  const startFlight = useCallback((params: StartFlightParams) => {
    clearTimer();
    // Signal to CustomDragOverlay that FlightProxy owns the token from here:
    // dnd-kit's own drop-animation clone must NOT play or the token doubles.
    (window as Window & { __dragFlightActive?: boolean }).__dragFlightActive = true;
    const origin = params.fromX != null && params.fromY != null
      ? { x: params.fromX, y: params.fromY }
      : resolveFlightOrigin();
    setState({ mode: 'flight', ...params, fromX: origin.x, fromY: origin.y });
  }, [clearTimer]);

  const springBack = useCallback((residentId: string) => {
    clearTimer();
    setState({ mode: 'returning', residentId });
    // Visual animation timing, deliberately outside any game-time provider
    // eslint-disable-next-line no-restricted-globals
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setState({ mode: 'idle' });
    }, SPRING_BACK_MS);
  }, [clearTimer]);

  const settle = useCallback(() => {
    clearTimer();
    (window as Window & { __dragFlightActive?: boolean }).__dragFlightActive = false;
    setState({ mode: 'idle' });
  }, [clearTimer]);

  return { state, startDrag, startFlight, springBack, settle };
}

/** Center of an element, for flight from/to coordinates. */
export function elementCenter(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
