import { pointerWithin, rectIntersection, type ClientRect, type CollisionDetection, type Coordinates, type DroppableContainer } from '@dnd-kit/core';

/**
 * Magnetic slot targeting for `/game` (PLAN-043 T1.2).
 *
 * `pointerWithin` only hits the droppable exactly under the pointer, so a medallion released next to a slot
 * (on its label, in the gap, a few px outside the ring) was lost without a word — measured on the goblin and
 * ruins planners: 0 of 7 drops landed from the label or from 40 px out. The slot's own config already promised
 * a magnet (`getDragConfig().magnetism.radiusPx`); only a test page used it.
 *
 * Rule: the droppable under the pointer wins, as before. Otherwise the nearest SLOT (`data.type === 'slot'`)
 * whose rectangle is within `radiusPx` of the pointer wins. Other droppables (POI markers, map targets) are
 * never attracted: they keep the exact-hit behaviour.
 *
 * Carrying a token OUT of a slot (`slot-token` drag): the slot it came from never beats another slot. Releasing
 * near a neighbour means the neighbour; the origin wins only when nothing else is in reach (a no-op drop).
 */

/** Distance from a point to a rectangle (0 when inside). */
export function distanceToRect(point: Coordinates, rect: ClientRect): number {
  const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
  const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
  return Math.hypot(dx, dy);
}

export interface MagnetCandidate {
  id: string | number;
  rect: ClientRect;
}

/**
 * Nearest candidate within `radiusPx` of `point`, or `null`. Ties go to the first candidate.
 * `originId` (the slot a carried token comes from) is only returned when no other candidate is in reach.
 */
export function nearestWithin(point: Coordinates, candidates: readonly MagnetCandidate[], radiusPx: number, originId?: string | number) {
  let best: { id: string | number; distance: number } | null = null;
  let origin: { id: string | number; distance: number } | null = null;
  for (const candidate of candidates) {
    const distance = distanceToRect(point, candidate.rect);
    if (distance > radiusPx) continue;
    if (candidate.id === originId) {
      origin = { id: candidate.id, distance };
      continue;
    }
    if (!best || distance < best.distance) best = { id: candidate.id, distance };
  }
  return best ?? origin;
}

const isSlot = (container: DroppableContainer) => (container.data.current as { type?: string } | undefined)?.type === 'slot';

/** Collision detection for the `/game` DndContext: exact hit first, then the nearest slot within the magnet radius. */
export function createMagneticSlotCollision(radiusPx: number): CollisionDetection {
  return (args) => {
    const drag = args.active?.data.current as { type?: string; slotId?: string } | undefined;
    const originId = drag?.type === 'slot-token' ? drag.slotId : undefined;
    /* KeyboardSensor drags have no `pointerCoordinates` — `pointerWithin` would
     *  always return empty and the drop could never resolve (WS-3 / AC-15).
     *  Fall back to `rectIntersection` on the dragged element's transformed
     *  rect: arrow keys walk the token over the droppables. */
    const exactAll = args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);
    /* overlapping rectangles: a neighbour under the pointer beats the slot the token came from */
    const exact = originId !== undefined && exactAll.length > 1 ? exactAll.filter((c) => c.id !== originId) : exactAll;
    if (exact.length > 0 || !args.pointerCoordinates || radiusPx <= 0) return exact;
    const byId = new Map<string | number, DroppableContainer>();
    const candidates: MagnetCandidate[] = [];
    for (const container of args.droppableContainers) {
      if (container.disabled || !isSlot(container)) continue;
      const rect = args.droppableRects.get(container.id);
      if (!rect) continue;
      byId.set(container.id, container);
      candidates.push({ id: container.id, rect });
    }
    const hit = nearestWithin(args.pointerCoordinates, candidates, radiusPx, originId);
    const container = hit && byId.get(hit.id);
    return hit && container ? [{ id: hit.id, data: { droppableContainer: container, value: hit.distance } }] : [];
  };
}
