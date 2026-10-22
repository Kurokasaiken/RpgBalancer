import { describe, it, expect } from 'vitest';
import { distanceToRect, nearestWithin } from '@/ui/idleVillage/interaction/magneticCollision';

const rect = (left: number, top: number, w = 56, h = 56) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h });

describe('magnetic slot targeting (PLAN-043 T1.2)', () => {
  it('distance is 0 inside the rectangle and the straight gap outside it', () => {
    const r = rect(100, 100);
    expect(distanceToRect({ x: 120, y: 120 }, r)).toBe(0);
    expect(distanceToRect({ x: 190, y: 120 }, r)).toBe(34); // 190 - 156
    expect(distanceToRect({ x: 120, y: 180 }, r)).toBe(24); // 180 - 156
    expect(Math.round(distanceToRect({ x: 190, y: 180 }, r))).toBe(Math.round(Math.hypot(34, 24)));
  });

  it('a drop on the label under the ring (24 px away) and 40 px out both land on the slot', () => {
    const slot = [{ id: 'a', rect: rect(100, 100) }];
    expect(nearestWithin({ x: 128, y: 180 }, slot, 120)?.id).toBe('a');
    expect(nearestWithin({ x: 196, y: 128 }, slot, 120)?.id).toBe('a');
  });

  // INV:drag-config.INV-1
  it('nothing is attracted beyond the radius', () => {
    const slot = [{ id: 'a', rect: rect(100, 100) }];
    expect(nearestWithin({ x: 400, y: 128 }, slot, 120)).toBeNull();
  });

  it('between two slots the nearer one wins, and the choice is stable on ties', () => {
    const slots = [
      { id: 'left', rect: rect(100, 100) },
      { id: 'right', rect: rect(220, 100) },
    ];
    expect(nearestWithin({ x: 170, y: 128 }, slots, 120)?.id).toBe('left'); // 14 px vs 50 px
    expect(nearestWithin({ x: 188, y: 128 }, slots, 120)?.id).toBe('left'); // exact tie (32/32): first wins
    expect(nearestWithin({ x: 200, y: 128 }, slots, 120)?.id).toBe('right');
  });

  it('a radius of 0 attracts only when the point is inside', () => {
    const slot = [{ id: 'a', rect: rect(100, 100) }];
    expect(nearestWithin({ x: 120, y: 120 }, slot, 0)?.id).toBe('a');
    expect(nearestWithin({ x: 160, y: 120 }, slot, 0)).toBeNull();
  });

  it('carrying a token out of a slot: a neighbour in reach beats the slot it came from', () => {
    // origin on the right, target on the left; the pointer sits to the LEFT of the target, 40 px out, and closer to
    // nothing else — and also (second case) in the gap where the origin is nearer than the target
    const slots = [
      { id: 'target', rect: rect(100, 100) },
      { id: 'origin', rect: rect(170, 100) },
    ];
    expect(nearestWithin({ x: 200, y: 128 }, slots, 120)?.id).toBe('origin'); // no origin hint: nearest wins
    expect(nearestWithin({ x: 200, y: 128 }, slots, 120, 'origin')?.id).toBe('target');
  });

  it('the origin wins only when nothing else is in reach (a no-op drop)', () => {
    const slots = [
      { id: 'origin', rect: rect(100, 100) },
      { id: 'far', rect: rect(900, 100) },
    ];
    expect(nearestWithin({ x: 128, y: 128 }, slots, 120, 'origin')?.id).toBe('origin');
  });
});

describe('hud64 magnet retune — slot-scoped 120 → 129.5 (PLAN-043 WS-1 T1.3)', () => {
  /* The 64px HUD box shrinks the registered rect (half-width 41.5 → 32); the
   * slot-scoped radius restores identical axis reach (32+129.5 = 41.5+120 =
   * 161.5px) at the price of a documented ≤4.1px diagonal loss. The grid below
   * runs the REAL resolver (`nearestWithin`) — not a reimplementation — over
   * polar samples around the slot centre: per direction it finds the furthest
   * still-attracted point for the old and new configurations and diffs them. */
  const OLD = { half: 41.5, radius: 120 };   // legacy 83px box
  const NEW = { half: 32, radius: 129.5 };   // hud64 64px box
  const rectAround = (half: number) => ({ left: -half, top: -half, right: half, bottom: half, width: half * 2, height: half * 2 });
  const oldCandidates = [{ id: 'slot', rect: rectAround(OLD.half) }];
  const newCandidates = [{ id: 'slot', rect: rectAround(NEW.half) }];

  /** Furthest attracted distance (px) from the centre along `deg`, at 0.5px resolution. */
  const maxReach = (deg: number, candidates: typeof oldCandidates, radius: number): number => {
    const rad = (deg * Math.PI) / 180;
    let reach = 0;
    for (let d = 0; d <= 260; d += 0.5) {
      const hit = nearestWithin({ x: d * Math.cos(rad), y: d * Math.sin(rad) }, candidates, radius);
      if (!hit) break;
      reach = d;
    }
    return reach;
  };

  const DEG_STEP = 5;
  const losses: { deg: number; loss: number }[] = [];
  for (let deg = 0; deg < 360; deg += DEG_STEP) {
    const oldReach = maxReach(deg, oldCandidates, OLD.radius);
    const newReach = maxReach(deg, newCandidates, NEW.radius);
    losses.push({ deg, loss: oldReach - newReach });
  }

  it('axis reach is identical (zero loss on the four axes)', () => {
    for (const deg of [0, 90, 180, 270]) {
      const entry = losses.find((l) => l.deg === deg)!;
      expect(entry.loss).toBe(0); // 32+129.5 = 41.5+120 = 161.5 exactly
    }
  });

  it('no direction loses more than the documented 4.1px (diagonal-only trade)', () => {
    const worst = Math.max(...losses.map((l) => l.loss));
    expect(worst).toBeGreaterThan(0); // the loss exists — it is the documented trade
    expect(worst).toBeLessThanOrEqual(4.1);
    // …and it concentrates on the diagonals, not on off-axis gaps
    for (const { deg, loss } of losses) {
      const mod = deg % 90;
      const nearAxis = mod <= DEG_STEP || mod >= 90 - DEG_STEP;
      if (nearAxis) expect(loss).toBeLessThanOrEqual(0.5);
    }
  });

  it('the effective radius is a config value, not a literal at the call site', () => {
    expect(getCurrentDragConfig().magnetism.slotRadiusPx).toBe(129.5);
    expect(getCurrentDragConfig().magnetism.radiusPx).toBe(120); // other consumers untouched
  });
});

import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { EXTRACTION_HOLD_MOVE_TOLERANCE_PX, movedBeyondHold } from '@/ui/idleVillage/interaction/useExtractionSequence';

describe('extraction hold is a STILL press (PLAN-043 T1.1)', () => {
  const origin = { x: 200, y: 200 };
  it('stays a hold while the pointer jitters inside the tolerance', () => {
    expect(movedBeyondHold(origin, { x: 202, y: 201 })).toBe(false);
    expect(movedBeyondHold(origin, { x: 200 + EXTRACTION_HOLD_MOVE_TOLERANCE_PX, y: 200 })).toBe(false);
  });
  it('becomes a drag as soon as the pointer travels beyond it, in any direction', () => {
    expect(movedBeyondHold(origin, { x: 200 + EXTRACTION_HOLD_MOVE_TOLERANCE_PX + 1, y: 200 })).toBe(true);
    expect(movedBeyondHold(origin, { x: 200, y: 190 })).toBe(true);
    expect(movedBeyondHold(origin, { x: 196, y: 197 }, 4)).toBe(true); // 5 px diagonal
  });
  it('the tolerance stays well below dnd-kit activation (8 px), so the hold stops first', () => {
    expect(EXTRACTION_HOLD_MOVE_TOLERANCE_PX).toBeLessThan(8);
  });
});
