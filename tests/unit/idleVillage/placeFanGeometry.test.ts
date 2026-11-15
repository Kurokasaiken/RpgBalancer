import { describe, expect, it } from 'vitest';
import {
  FAN_RING,
  assignFanCards,
  fanActivityCapacity,
  ringFillOrder,
  ringPoint,
  separatorAngles,
  skirtPath,
  slotAngles,
  slicePath,
  sliceProgressPath,
} from '@/ui/idleVillage/components/gameFrame/placeFanGeometry';

// Anello ellittico di spicchi (modello battezzato refs/approved-fan-v65.png):
// N settori anulari parametrici contigui, fill order sx→dx, overflow → planner.

describe('placeFanGeometry (anello ellittico v65)', () => {
  it('N settori contigui coprono i 360° al netto dei gap oro', () => {
    const step = 360 / FAN_RING.slotsTotal;
    for (let i = 0; i < FAN_RING.slotsTotal; i++) {
      const { a0, a1 } = slotAngles(FAN_RING, i);
      expect(a1 - a0).toBeCloseTo(step - FAN_RING.gapDeg, 6);
    }
    expect(separatorAngles(FAN_RING)).toHaveLength(FAN_RING.slotsTotal);
  });

  it('i settori sono anulari: bordo interno ≠ bordo esterno', () => {
    const [xi] = ringPoint(FAN_RING, 0, 0);
    const [xo] = ringPoint(FAN_RING, 0, 1);
    expect(xo - xi).toBeGreaterThan(50);
    expect(slicePath(FAN_RING, 0)).toMatch(/^M .*A .*L .*A .*Z$/);
  });

  it('fill order: indice slot — da NE in senso orario, tutti gli slot', () => {
    const order = ringFillOrder();
    expect(order).toEqual(Array.from({ length: FAN_RING.slotsTotal }, (_, i) => i));
  });

  it('assegnazione stabile: attività[j] → fillOrder[j], vuoti → null, oltre → overflow', () => {
    const cap = fanActivityCapacity();
    const order = ringFillOrder();
    const acts = Array.from({ length: cap + 3 }, (_, i) => ({ id: `a${i}` }));
    const full = assignFanCards(acts);
    expect(full.slots).toHaveLength(FAN_RING.slotsTotal);
    for (let i = 0; i < cap; i++) {
      expect(full.slots[order[i]]?.id).toBe(`a${i}`);
    }
    expect(full.overflow.map((a) => a.id)).toEqual([`a${cap}`, `a${cap + 1}`, `a${cap + 2}`]);

    const few = assignFanCards(acts.slice(0, 2));
    expect(few.slots[order[0]]?.id).toBe('a0');
    expect(few.slots[order[1]]?.id).toBe('a1');
    expect(few.slots[order[2]]).toBeNull();
    expect(few.overflow).toHaveLength(0);
  });

  it('progress: scrittura dal bordo interno, frac 0 → null, frac 1 → settore quasi pieno', () => {
    expect(sliceProgressPath(FAN_RING, 0, 0)).toBeNull();
    expect(sliceProgressPath(FAN_RING, 0, 0.5)).toContain('A');
    expect(sliceProgressPath(FAN_RING, 0, 1)).toContain('A');
  });

  it('gonna: path chiuso sotto il bordo frontale', () => {
    const d = skirtPath(FAN_RING);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });
});
