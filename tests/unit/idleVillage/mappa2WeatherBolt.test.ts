import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOLT_MAX_LENGTH_PX, boltPath } from '@/ui/idleVillage/pixiSpike/mountainStorm';

const lcg = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

describe('mappa2 lightning stays peak-sized', () => {
  it('never exceeds ~36 world px tall nor wanders sideways more than a peak is wide', () => {
    for (let s = 1; s <= 200; s += 1) {
      const pts = boltPath(lcg(s), 1000, 200);
      const h = pts[pts.length - 1][1] - pts[0][1];
      const xs = pts.map((p) => p[0]);
      expect(h).toBeGreaterThan(15);
      expect(h).toBeLessThanOrEqual(BOLT_MAX_LENGTH_PX);
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(20);
    }
  });

  it('scales with the world-to-canvas ratio', () => {
    const a = boltPath(lcg(9), 0, 0, 1, 1);
    const b = boltPath(lcg(9), 0, 0, 2, 2);
    expect(b[b.length - 1][1]).toBeCloseTo(a[a.length - 1][1] * 2, 5);
  });
});

import { STREAKS_PER_CELL, WIND, cellWidth, gust, streakProgress } from '@/ui/idleVillage/pixiSpike/mountainStorm';

describe('mappa2 mountain storm: sized and driven like a storm on a peak', () => {
  it('cells are peak-sized, never the old 300 px blobs', () => {
    for (const r of [20, 34, 44, 59, 115, 400]) {
      const w = cellWidth(r);
      expect(w).toBeGreaterThanOrEqual(84);
      expect(w).toBeLessThanOrEqual(140);
    }
  });

  it('wind blows one way (north-west to south-east) and gusts stay in a sane band', () => {
    expect(WIND.x).toBeGreaterThan(0);
    expect(WIND.y).toBeGreaterThan(0);
    for (let t = 0; t < 20000; t += 37) {
      const g = gust(t, 1.3);
      expect(g).toBeGreaterThan(0.4);
      expect(g).toBeLessThan(1.4);
    }
  });

  it('snow streaks wrap along the wind, deterministically and without jumping', () => {
    expect(STREAKS_PER_CELL).toBeGreaterThanOrEqual(20);
    const a = streakProgress(0.37, 1000, 1, 1);
    expect(streakProgress(0.37, 1000, 1, 1)).toBe(a);
    let prev = streakProgress(0.37, 0, 1, 1);
    for (let t = 1; t < 400; t += 1) {
      const p = streakProgress(0.37, t, 1, 1);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
      const d = p - prev;
      expect(d > 0 || d < -0.9).toBe(true); // forward, or a wrap
      prev = p;
    }
  });
});

describe('mappa2 weather: nothing pulses faster than a few seconds (simT counts frames, 60/s)', () => {
  it('valley mist swell and the lava pulse stay slow', () => {
    const src = readFileSync('src/ui/idleVillage/pixiSpike/regionalWeatherOverlay.ts', 'utf8');
    expect(src).toMatch(/simT \* 0\.00028 \* s\.wanderB/); // mist: ~40-100 s per cycle
    expect(src).not.toMatch(/simT \* 0\.012 \* s\.wanderB/); // the old 1-3 s mist pulse
    expect(src).not.toMatch(/simT \* 0\.53/); // the old 0.12 s lava ripple
  });
});
