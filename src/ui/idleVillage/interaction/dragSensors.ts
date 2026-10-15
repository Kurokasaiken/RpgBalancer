import { PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';

/**
 * Pointer sensor that starts a drag on EITHER of two paths:
 * - movement: the pointer travels `distance` (quick flick);
 * - hold: the press stays down for `delay` (the medallion appears without moving).
 *
 * dnd-kit merges activators by event name, so two PointerSensors in one
 * `useSensors` do not coexist — the second overwrites the first. One sensor
 * with a combined `{ delay, distance }` constraint is the supported shape, but
 * dnd-kit never clears the hold timer when movement starts the drag first, so
 * the timer would call `onStart` a second time. The guard below starts once.
 */
class HoldOrMovePointerSensor extends PointerSensor {}

type SensorInternals = {
  activated: boolean;
  timeoutId: ReturnType<typeof setTimeout> | null;
};
// `handleStart`, `activated` and `timeoutId` are private in dnd-kit's typings;
// the constructor binds `this.handleStart` through the prototype chain, so a
// prototype override is picked up.
const baseHandleStart = (PointerSensor.prototype as unknown as { handleStart: () => void }).handleStart;
(HoldOrMovePointerSensor.prototype as unknown as { handleStart: () => void }).handleStart = function (
  this: SensorInternals,
) {
  if (this.timeoutId !== null) {
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }
  if (this.activated) return;
  baseHandleStart.call(this);
};

/**
 * Activation for roster drags. A quick click reaches neither threshold, so it
 * stays a plain click; holding or moving starts the drag.
 */
export function useIdleVillageDragSensors() {
  const cfg = getCurrentDragConfig();
  return useSensors(
    useSensor(HoldOrMovePointerSensor, {
      activationConstraint: {
        delay: cfg.timing.holdToDragMs,
        distance: cfg.thresholds.minDragDistance,
        // Never cancel: movement past `distance` starts the drag instead. A finite
        // tolerance is checked before `distance`, so a fast first move would abort.
        tolerance: Number.POSITIVE_INFINITY,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: cfg.timing.holdToDragMs, tolerance: cfg.thresholds.minDragDistance },
    }),
  );
}
