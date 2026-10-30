import { describe, expect, it } from 'vitest';
import {
  CROWN,
  CROWN_BELLY_PUFFS,
  CROWN_PUFFS_PER_CELL,
  CROWN_BELLY_TINT,
  CROWN_TINT_BELLY,
  CROWN_TINT_TOP,
  MAX_STORM_SPRITES,
  SNOW_PEAKS,
  crownSpec,
} from '@/ui/idleVillage/pixiSpike/mountainStorm';

const lum = (hex: number) => ((hex >> 16) & 255) + ((hex >> 8) & 255) + (hex & 255);

describe('mappa2 peak storm crowns (visual-fork B\'\' baseline)', () => {
  it('covers every grey snowy summit detected on the painting (15, unique ids, on-canvas)', () => {
    expect(SNOW_PEAKS).toHaveLength(15);
    expect(new Set(SNOW_PEAKS.map((p) => p.id)).size).toBe(15);
    for (const p of SNOW_PEAKS) {
      expect(p.x).toBeGreaterThanOrEqual(900);
      expect(p.x).toBeLessThanOrEqual(1720);
      expect(p.y).toBeGreaterThanOrEqual(40);
      expect(p.y).toBeLessThanOrEqual(520);
    }
  });

  it('lays puffs in an annulus around the summit — hole for the tip, never a blob', () => {
    for (const cell of SNOW_PEAKS) {
      const s = crownSpec(cell, 7);
      expect(s.puffs.length).toBe(CROWN_PUFFS_PER_CELL + CROWN_BELLY_PUFFS);
      for (const p of s.puffs) {
        const d = Math.hypot(p.dx / s.rx, p.dy / s.ry);
        expect(d).toBeGreaterThanOrEqual(0.42); // the tip must emerge through the hole
        expect(d).toBeLessThanOrEqual(1.45); // belly hangs slightly below the rim
      }
      expect(s.rx).toBeCloseTo((cell.width ?? 0) * CROWN.rx, 5);
    }
  });

  it('tints the crown light-on-top, slate-on-bottom (storm grammar, not flat dark)', () => {
    const s = crownSpec(SNOW_PEAKS[0], 3);
    const top = s.puffs.filter((p) => p.dy < 0);
    const bottom = s.puffs.filter((p) => p.dy > 0);
    const mean = (list: typeof top) => list.reduce((a, p) => a + lum(p.tint), 0) / list.length;
    expect(mean(top)).toBeGreaterThan(mean(bottom));
    for (const p of s.puffs) {
      expect(lum(p.tint)).toBeLessThanOrEqual(lum(CROWN_TINT_TOP));
      expect(lum(p.tint)).toBeGreaterThanOrEqual(lum(CROWN_BELLY_TINT));
    }
  });

  it('owns its ground shadow inside the same spec, cast down-wind (T-07)', () => {
    for (const cell of SNOW_PEAKS) {
      const s = crownSpec(cell, 11);
      expect(s.shadow.dx).toBeGreaterThan(0); // SE of the summit, like the wind
      expect(s.shadow.dy).toBeGreaterThan(0);
      expect(s.shadow.alpha).toBeGreaterThan(0);
      expect(s.shadow.alpha).toBeLessThanOrEqual(0.35);
    }
  });

  it('is deterministic per cell (seeded, never Math.random)', () => {
    const a = crownSpec(SNOW_PEAKS[4], 42);
    const b = crownSpec(SNOW_PEAKS[4], 42);
    expect(a.puffs).toEqual(b.puffs);
    const c = crownSpec(SNOW_PEAKS[4], 43);
    expect(c.puffs).not.toEqual(a.puffs);
  });

  it('stays under the storm sprite budget (crowns + haze + shadow + glow per cell)', () => {
    const perCell = CROWN_PUFFS_PER_CELL + CROWN_BELLY_PUFFS + 3;
    expect(perCell * SNOW_PEAKS.length).toBeLessThanOrEqual(MAX_STORM_SPRITES);
  });
});
