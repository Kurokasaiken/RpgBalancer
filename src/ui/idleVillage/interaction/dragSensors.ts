import {
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  getFirstCollision,
  useSensor,
  useSensors,
  type KeyboardCoordinateGetter,
  type PointerSensorProps,
} from '@dnd-kit/core';
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
/** Drag ids of slotted tokens (`slotTokenDragId` in `ResidentSlotRack`): a token in a slot is moved, never «held up». */
const SLOT_TOKEN_DRAG_PREFIX = 'slot-token:';

/** A slotted token's swap drag — painted by the rack's own ghost, never by the shared overlay (R-234). */
export const isSlotTokenDragId = (id: unknown): boolean => String(id).startsWith(SLOT_TOKEN_DRAG_PREFIX);

class HoldOrMovePointerSensor extends PointerSensor {
  /**
   * On a slotted token, holding means EXTRACT (press-and-hold takes the resident out of the slot, ~0.75 s):
   * only movement may start the swap drag. With the roster's hold-to-drag (180 ms) the swap drag started by itself
   * while the player was still holding, cancelled the extraction and the resident never came back to the roster
   * (PLAN-043: «tengo premuto su un pg, non si estrae più, si confonde con lo swap»).
   */
  constructor(props: PointerSensorProps) {
    const isSlotToken = String(props.active).startsWith(SLOT_TOKEN_DRAG_PREFIX);
    const constraint = props.options.activationConstraint;
    super(
      isSlotToken && constraint && 'distance' in constraint
        ? { ...props, options: { ...props.options, activationConstraint: { distance: constraint.distance } } }
        : props,
    );
  }
}

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

const ARROW_CODES = [KeyboardCode.Down, KeyboardCode.Up, KeyboardCode.Left, KeyboardCode.Right];

/**
 * Droppable-hopping coordinate getter for NON-sortable drags (tray companion
 * tiles, seated slot tokens, roster cards): `sortableKeyboardCoordinates`
 * silently no-ops unless the active draggable is itself a registered
 * droppable (`droppableContainers.get(active.id)`), which quest draggables
 * never are — so arrows moved nothing and the drop landed with `over: null`
 * (WS-3 / AC-15). An arrow key instead jumps the dragged rect onto the
 * closest enabled droppable in that direction; the pointerCoordinates-less
 * `rectIntersection` branch of the magnet collision then resolves `over`,
 * and Space commits through the same `onDragEnd` a pointer drop uses.
 * Pressing the same arrow again skips the droppable already under the token
 * so repeated presses cycle through the candidates.
 */
const droppableHoppingCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  if (!(ARROW_CODES as string[]).includes(event.code)) return undefined;
  const { active, collisionRect, droppableRects, droppableContainers, over } = context;
  if (!active || !collisionRect) return undefined;
  event.preventDefault();

  const candidates = droppableContainers.getEnabled().filter((entry) => {
    if (entry.disabled) return false;
    const rect = droppableRects.get(entry.id);
    if (!rect) return false;
    /* Skip droppables that already reject THIS payload: the session renders
     *  the per-slot verdict as `data-drop-state="invalid"` while the drag is
     *  armed, so hopping there would be a guaranteed refusal. Droppables
     *  without the attribute (map markers, other surfaces) stay hoppable. */
    const dropState =
      entry.node.current?.closest('[data-drop-state]')?.getAttribute('data-drop-state') ??
      entry.node.current?.getAttribute('data-drop-state');
    if (dropState === 'invalid') return false;
    switch (event.code) {
      case KeyboardCode.Down: return collisionRect.top < rect.top;
      case KeyboardCode.Up: return collisionRect.top > rect.top;
      case KeyboardCode.Left: return collisionRect.left > rect.left;
      case KeyboardCode.Right: return collisionRect.left < rect.left;
      default: return false;
    }
  });
  const collisions = closestCorners({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: candidates,
    pointerCoordinates: null,
  });
  let closestId = getFirstCollision(collisions, 'id');
  if (closestId === over?.id && collisions.length > 1) closestId = collisions[1].id;
  const rect = closestId != null ? droppableRects.get(closestId) : null;
  return rect ? { x: rect.left, y: rect.top } : undefined;
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
    /* Keyboard parity (WS-3 / AC-15): focus a draggable (slot token, tray
     *  companion tile, roster card) → Space picks it up, arrows hop between
     *  droppables, Space commits the same onDragEnd path a pointer drop
     *  would. */
    useSensor(KeyboardSensor, { coordinateGetter: droppableHoppingCoordinates }),
  );
}
