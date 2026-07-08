/**
 * DragOutcomeFlight — single render surface for the "magnetic" token flight.
 *
 * Renders the FlightProxy from a useDragOutcome state so every page/kit shows
 * exactly the same flight (same easing, duration, doubling suppression).
 * `onComplete` fires when the token lands: apply the assignment there, then
 * call `settle()` (or rely on the caller that already does).
 */
import { FlightProxy } from '@/ui/idleVillage/components/FlightProxy';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DragOutcomeState } from './useDragOutcome';

export interface DragOutcomeFlightProps {
  state: DragOutcomeState;
  residentsById: Record<string, ResidentState>;
  onComplete: (residentId: string, slotId?: string, isInset?: boolean) => void;
}

export function DragOutcomeFlight({ state, residentsById, onComplete }: DragOutcomeFlightProps) {
  if (state.mode !== 'flight') return null;
  return (
    <FlightProxy
      residentId={state.residentId}
      fromX={state.fromX}
      fromY={state.fromY}
      toX={state.toX}
      toY={state.toY}
      slotId={state.slotId}
      isInset={state.isInset}
      onComplete={onComplete}
      residentsById={residentsById}
    />
  );
}
