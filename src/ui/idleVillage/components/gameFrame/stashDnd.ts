/**
 * stashDnd — typed drag identities for the village warehouse ↔ quest bag
 * exchange (PLAN-073, artifact-r003).
 *
 * Every draggable/droppable carries a discriminated payload under `data.kind`
 * — never string matching on ids. `kind` (not `type`) is used so the slot
 * magnet (`data.type === 'slot'`, PLAN-043 T1.2) never attracts these
 * droppables: warehouse↔bag targeting is exact-hit only.
 *
 *   stash-item:*        warehouse row in planner-bound mode (draggable)
 *   bag-item:*          item packed in a quest bag slot (draggable)
 *   bag-slot:*          a quest bag slot (droppable)
 *   stash-dropzone      the warehouse shelf (droppable — bag items return here)
 */

/** Droppable id covering the whole warehouse shelf — a bag item released here returns to stock. */
export const STASH_DROPZONE_ID = 'stash-dropzone';

export const stashItemDragId = (itemId: string): string => `stash-item:${itemId}`;
export const bagItemDragId = (poiId: string, slotIndex: number): string => `bag-item:${poiId}:${slotIndex}`;
export const bagSlotDropId = (poiId: string, slotIndex: number): string => `bag-slot:${poiId}:${slotIndex}`;

export interface StashItemDragPayload {
  kind: 'stash-item';
  itemId: string;
}
export interface BagItemDragPayload {
  kind: 'bag-item';
  poiId: string;
  slotIndex: number;
  itemId: string;
}
export type StashDragPayload = StashItemDragPayload | BagItemDragPayload;

export interface StashDropzonePayload {
  kind: 'stash-dropzone';
}
export interface BagSlotDropPayload {
  kind: 'bag-slot';
  poiId: string;
  slotIndex: number;
}
export type StashDropPayload = StashDropzonePayload | BagSlotDropPayload;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * Narrows `active.data.current` to a stash drag payload; returns `null` for
 * every other drag kind so the router leaves resident/slot-token flows
 * untouched.
 */
export function readStashDragPayload(data: unknown): StashDragPayload | null {
  if (!isRecord(data)) return null;
  if (data.kind === 'stash-item' && typeof data.itemId === 'string') return { kind: 'stash-item', itemId: data.itemId };
  if (
    data.kind === 'bag-item' &&
    typeof data.poiId === 'string' &&
    typeof data.slotIndex === 'number' &&
    typeof data.itemId === 'string'
  ) {
    return { kind: 'bag-item', poiId: data.poiId, slotIndex: data.slotIndex, itemId: data.itemId };
  }
  return null;
}

/**
 * Narrows `over.data.current` to a stash drop payload; returns `null` when the
 * pointer rests on any other droppable.
 */
export function readStashDropPayload(data: unknown): StashDropPayload | null {
  if (!isRecord(data)) return null;
  if (data.kind === 'stash-dropzone') return { kind: 'stash-dropzone' };
  if (data.kind === 'bag-slot' && typeof data.poiId === 'string' && typeof data.slotIndex === 'number') {
    return { kind: 'bag-slot', poiId: data.poiId, slotIndex: data.slotIndex };
  }
  return null;
}

/**
 * Central drag-end routing (PLAN-073 A2). Pure decision — the caller performs
 * the store mutation so invalid drops can never mutate state:
 * - shelf item → own bag slot: `assign` — `assignToSlot` swaps atomically
 *   when the target slot is occupied;
 * - shelf item → another planner's slot or the shelf itself: cancel;
 * - bag item → shelf: `release`;
 * - every other combination: `noop` (cancel/Esc never reach here).
 */
export type StashDragVerdict =
  | { action: 'assign'; poiId: string; itemId: string; slotIndex: number }
  | { action: 'release'; poiId: string; slotIndex: number }
  | { action: 'noop' };

export function routeStashDragEnd(
  drag: StashDragPayload,
  drop: StashDropPayload | null,
  activeOwner: string | null,
): StashDragVerdict {
  if (drag.kind === 'stash-item') {
    /* Cross-owner guard (r003 blocker): a shelf drag may only land on the
     * bag of the planner the warehouse is bound to. */
    if (drop?.kind === 'bag-slot' && activeOwner && drop.poiId === activeOwner) {
      return { action: 'assign', poiId: drop.poiId, itemId: drag.itemId, slotIndex: drop.slotIndex };
    }
    return { action: 'noop' };
  }
  /* drag.kind === 'bag-item' */
  if (drop?.kind === 'stash-dropzone') {
    return { action: 'release', poiId: drag.poiId, slotIndex: drag.slotIndex };
  }
  return { action: 'noop' };
}
