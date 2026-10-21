/**
 * PLAN-073 stash DnD contract: typed payload parsing and the central
 * drag-end router — shelf→own slot assigns/swaps, bag→shelf releases,
 * every cross-owner or unrelated combination is a mutation-free noop.
 */
import { describe, expect, it } from 'vitest';
import {
  STASH_DROPZONE_ID,
  bagItemDragId,
  bagSlotDropId,
  readStashDragPayload,
  readStashDropPayload,
  routeStashDragEnd,
  stashItemDragId,
} from '@/ui/idleVillage/components/gameFrame/stashDnd';

const POI = 'poi-goblin';
const OTHER = 'poi-rovine';

describe('stashDnd — id builders + payload parsers', () => {
  it('builds stable namespaced ids', () => {
    expect(stashItemDragId('quest_consumable_forza')).toBe('stash-item:quest_consumable_forza');
    expect(bagItemDragId(POI, 2)).toBe(`bag-item:${POI}:2`);
    expect(bagSlotDropId(POI, 0)).toBe(`bag-slot:${POI}:0`);
    expect(STASH_DROPZONE_ID).toBe('stash-dropzone');
  });

  it('narrows drag payloads and rejects everything else', () => {
    expect(readStashDragPayload({ kind: 'stash-item', itemId: 'x' })).toEqual({ kind: 'stash-item', itemId: 'x' });
    expect(readStashDragPayload({ kind: 'bag-item', poiId: POI, slotIndex: 1, itemId: 'x' })).toEqual({
      kind: 'bag-item',
      poiId: POI,
      slotIndex: 1,
      itemId: 'x',
    });
    /* Resident and slot-token drags must pass through untouched. */
    expect(readStashDragPayload({ type: 'resident', residentId: 'r1' })).toBeNull();
    expect(readStashDragPayload({ type: 'slot-token', slotId: 's1' })).toBeNull();
    expect(readStashDragPayload(undefined)).toBeNull();
    expect(readStashDragPayload({ kind: 'bag-item', poiId: POI })).toBeNull(); // missing fields
  });

  it('narrows drop payloads and rejects everything else', () => {
    expect(readStashDropPayload({ kind: 'stash-dropzone' })).toEqual({ kind: 'stash-dropzone' });
    expect(readStashDropPayload({ kind: 'bag-slot', poiId: POI, slotIndex: 0 })).toEqual({
      kind: 'bag-slot',
      poiId: POI,
      slotIndex: 0,
    });
    expect(readStashDropPayload({ type: 'slot', slotId: 's1' })).toBeNull();
    expect(readStashDropPayload(undefined)).toBeNull();
  });
});

describe('stashDnd — routeStashDragEnd', () => {
  it('shelf item onto the bound planner slot → assign (assign/swap decided by the ledger)', () => {
    const verdict = routeStashDragEnd(
      { kind: 'stash-item', itemId: 'x' },
      { kind: 'bag-slot', poiId: POI, slotIndex: 1 },
      POI,
    );
    expect(verdict).toEqual({ action: 'assign', poiId: POI, itemId: 'x', slotIndex: 1 });
  });

  it('shelf item onto ANOTHER planner\'s slot → noop (cross-owner guard, r003)', () => {
    expect(
      routeStashDragEnd({ kind: 'stash-item', itemId: 'x' }, { kind: 'bag-slot', poiId: OTHER, slotIndex: 0 }, POI),
    ).toEqual({ action: 'noop' });
    /* …and with no owner at all every shelf drag cancels. */
    expect(
      routeStashDragEnd({ kind: 'stash-item', itemId: 'x' }, { kind: 'bag-slot', poiId: POI, slotIndex: 0 }, null),
    ).toEqual({ action: 'noop' });
  });

  it('shelf item dropped on the shelf or nowhere → noop (no mutation)', () => {
    expect(routeStashDragEnd({ kind: 'stash-item', itemId: 'x' }, { kind: 'stash-dropzone' }, POI)).toEqual({ action: 'noop' });
    expect(routeStashDragEnd({ kind: 'stash-item', itemId: 'x' }, null, POI)).toEqual({ action: 'noop' });
  });

  it('bag item onto the shelf → release on its own owner', () => {
    expect(
      routeStashDragEnd({ kind: 'bag-item', poiId: POI, slotIndex: 0, itemId: 'x' }, { kind: 'stash-dropzone' }, OTHER),
    ).toEqual({ action: 'release', poiId: POI, slotIndex: 0 });
  });

  it('bag item onto a slot (any owner) or nowhere → noop', () => {
    expect(
      routeStashDragEnd({ kind: 'bag-item', poiId: POI, slotIndex: 0, itemId: 'x' }, { kind: 'bag-slot', poiId: POI, slotIndex: 1 }, POI),
    ).toEqual({ action: 'noop' });
    expect(routeStashDragEnd({ kind: 'bag-item', poiId: POI, slotIndex: 0, itemId: 'x' }, null, POI)).toEqual({ action: 'noop' });
  });
});
