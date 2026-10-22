/**
 * Trauma channel (PLAN-050 §4) — deterministic envelope, bounds, and the
 * post-`cameraAt` composition contract (authored shots never corrupted).
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_QUEST_THEATRE_FX } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { cameraAt } from '@/ui/idleVillage/questS1Lab/render/depthTransform';
import { composeTrauma, traumaAt, traumaMaxOffset, traumaMaxRollShift } from '@/ui/idleVillage/questS1Lab/render/trauma';

const T = DEFAULT_QUEST_THEATRE_FX.depth.trauma;
const SHOT = DEFAULT_QUEST_THEATRE_FX.camera.shots['enter-settle'];
const ROLL_RAD = (T.maxRollDeg * Math.PI) / 180;

describe('traumaAt', () => {
  it('keeps full-strength shake above a perceptible stage-space floor', () => {
    expect(T.maxPan).toBeGreaterThanOrEqual(0.008);
    expect(T.maxRollDeg).toBeGreaterThanOrEqual(1.5);
  });

  it('is at rest before injection and for zero strength', () => {
    expect(traumaAt(0, 1, T)).toEqual({ x: 0, y: 0, roll: 0, envelope: 0 });
    expect(traumaAt(-50, 1, T).envelope).toBe(0);
    expect(traumaAt(300, 0, T).envelope).toBe(0);
  });

  it('decays to ~zero after a few decay constants', () => {
    const late = traumaAt(5 * T.decayMs, 1, T);
    expect(late.envelope).toBeLessThan(0.01);
    expect(Math.abs(late.x)).toBeLessThan(T.maxPan * 0.001);
    expect(Math.abs(late.roll)).toBeLessThan(ROLL_RAD * 0.001);
  });

  it('never exceeds the certified bounds at any time', () => {
    for (let t = 0; t <= 3000; t += 37) {
      const tr = traumaAt(t, 1, T);
      expect(Math.abs(tr.x)).toBeLessThanOrEqual(T.maxPan + 1e-9);
      expect(Math.abs(tr.y)).toBeLessThanOrEqual(T.maxPan + 1e-9);
      expect(Math.abs(tr.roll)).toBeLessThanOrEqual(ROLL_RAD + 1e-9);
    }
  });

  it('scales with strength² envelope (punchy onset, fast bleed)', () => {
    const half = traumaAt(100, 0.5, T);
    const full = traumaAt(100, 1, T);
    expect(half.envelope).toBeCloseTo(full.envelope / 2, 5);
    // amplitude = envelope² → half strength ⇒ quarter amplitude
    expect(Math.abs(half.x)).toBeLessThan(Math.abs(full.x));
  });

  it('is deterministic — same t, same state (frozen-clock captures)', () => {
    expect(traumaAt(123, 0.8, T)).toEqual(traumaAt(123, 0.8, T));
    expect(traumaAt(123, 0.8, T)).not.toEqual(traumaAt(124, 0.8, T));
  });
});

describe('composeTrauma', () => {
  it('leaves the authored state untouched when inactive', () => {
    const s = cameraAt(SHOT, 500);
    expect(composeTrauma(s, traumaAt(0, 1, T), T)).toBe(s);
    expect(composeTrauma(s, traumaAt(300, 0, T), T)).toBe(s);
  });

  it('moves pan by the bg share and zooms by the impact bump', () => {
    const s = cameraAt(SHOT, 500);
    const tr = traumaAt(80, 1, T);
    const out = composeTrauma(s, tr, T);
    expect(out.zoom).toBeCloseTo(s.zoom * (1 + tr.envelope * T.zoomBump), 8);
    expect(out.pan[0]).toBeCloseTo(s.pan[0] + tr.x * T.bgWeight, 8);
    expect(out.pan[1]).toBeCloseTo(s.pan[1] + tr.y * T.bgWeight, 8);
    // authored fields pass through untouched
    expect(out.blur).toBe(s.blur);
    expect(out.camVec).toBe(s.camVec);
  });
});

describe('proof reserves', () => {
  it('maxOffset is FG-weighted and positive', () => {
    expect(traumaMaxOffset(T)).toBeCloseTo(T.maxPan * T.fgWeight, 9);
    expect(traumaMaxOffset(T)).toBeGreaterThan(0);
  });
  it('roll shift grows with the sampled half extent', () => {
    const small = traumaMaxRollShift(T, [0.1, 0.1]);
    const big = traumaMaxRollShift(T, [0.5, 0.5]);
    expect(big).toBeGreaterThan(small);
    expect(small).toBeCloseTo(ROLL_RAD * 0.2, 9);
  });
});
