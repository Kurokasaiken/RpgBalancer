import { afterEach, describe, expect, it } from 'vitest';
import { elementCenter, getSlotComponentElement } from '@/ui/idleVillage/interaction/useDragOutcome';

const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

describe('slot flight target geometry', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses the Slot component rect rather than its caption/footer rack cell', () => {
    const slotId = 'poi-goblin:goblin-slot-member-1';
    const cell = document.createElement('div');
    cell.dataset.slotId = slotId;
    const slot = document.createElement('div');
    slot.dataset.testid = `slot-button-${slotId}`;
    cell.append(slot, document.createElement('p'));
    document.body.append(cell);

    slot.getBoundingClientRect = () => rect(100, 40, 64, 64);
    cell.getBoundingClientRect = () => rect(100, 40, 64, 84);

    const target = getSlotComponentElement(slotId);
    expect(target).toBe(slot);
    expect(elementCenter(target)).toEqual({ x: 132, y: 72 });
    expect(elementCenter(cell)).toEqual({ x: 132, y: 82 });
  });

  it('returns null when the slot component is not mounted', () => {
    expect(getSlotComponentElement('missing-slot')).toBeNull();
  });
});
