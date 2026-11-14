import { describe, expect, it } from 'vitest';
import {
  FAN_CARDS,
  assignFanCards,
  fanActivityCapacity,
  fanCardPoses,
  fanDioramaPose,
  fanRefAspect,
  nextFanSlot,
} from '@/ui/idleVillage/components/gameFrame/placeFanGeometry';

// PLAN-117 F2-T1 — ventaglio di carte: slot map misurata sul mockup (non
// parametrica), draw order back→front, socket permanenti, overflow → planner.

describe('placeFanGeometry (slot map misurata)', () => {
  it('renderizza tutte le posizioni misurate sul mockup, in draw order', () => {
    const poses = fanCardPoses();
    expect(poses).toHaveLength(FAN_CARDS.slots.length);
    // zIndex = indice: il primo è il più arretrato, l'ultimo il più avanti
    expect(poses.map((p) => p.zIndex)).toEqual([...Array(poses.length).keys()]);
  });

  it('ogni slot ha trasformazioni non uniformi (mockup non parametrico)', () => {
    const poses = fanCardPoses();
    const rotations = new Set(poses.map((p) => p.rotateDeg));
    const heights = new Set(poses.map((p) => p.hFrac));
    // il mockup è irregolare: rotazioni e altezze non possono essere tutte uguali
    expect(rotations.size).toBeGreaterThan(4);
    expect(heights.size).toBeGreaterThan(4);
    for (const p of poses) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.hFrac).toBeGreaterThan(0);
      expect(p.wFrac).toBeGreaterThan(0);
    }
  });

  it('fillOrder punta solo a slot validi e unici', () => {
    expect(new Set(FAN_CARDS.fillOrder).size).toBe(FAN_CARDS.fillOrder.length);
    for (const i of FAN_CARDS.fillOrder) {
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(FAN_CARDS.slots.length);
    }
    // gli slot non in fillOrder sono socket permanenti (▲)
    const sockets = fanCardPoses().filter((p) => !p.activityCapable);
    expect(sockets.length).toBe(FAN_CARDS.slots.length - FAN_CARDS.fillOrder.length);
  });

  it('assegnazione stabile: attività[i] → fillOrder[i], vuoti → null, oltre → overflow', () => {
    const cap = fanActivityCapacity();
    const acts = Array.from({ length: cap + 3 }, (_, i) => ({ id: `a${i}` }));
    const full = assignFanCards(acts);
    expect(full.slots).toHaveLength(FAN_CARDS.slots.length);
    for (let i = 0; i < cap; i++) {
      expect(full.slots[FAN_CARDS.fillOrder[i]]?.id).toBe(`a${i}`);
    }
    expect(full.overflow.map((a) => a.id)).toEqual([`a${cap}`, `a${cap + 1}`, `a${cap + 2}`]);

    const few = assignFanCards(acts.slice(0, 2));
    expect(few.slots[FAN_CARDS.fillOrder[0]]?.id).toBe('a0');
    expect(few.slots[FAN_CARDS.fillOrder[1]]?.id).toBe('a1');
    expect(few.slots[FAN_CARDS.fillOrder[2]]).toBeNull();
    expect(few.overflow).toHaveLength(0);
  });

  it('nextFanSlot fa wrap lungo il fillOrder', () => {
    const cap = fanActivityCapacity();
    expect(nextFanSlot(0, -1)).toBe(cap - 1);
    expect(nextFanSlot(cap - 1, 1)).toBe(0);
    expect(nextFanSlot(2, 1)).toBe(3);
  });

  it('il diorama sta sopra tutte le carte (draw order + 1)', () => {
    const d = fanDioramaPose();
    expect(d.zIndex).toBe(FAN_CARDS.slots.length);
    expect(d.hFrac).toBeGreaterThan(0);
  });

  it('l’aspect di riferimento è quello del mockup', () => {
    expect(fanRefAspect()).toBeCloseTo(1946 / 544, 3);
  });
});
