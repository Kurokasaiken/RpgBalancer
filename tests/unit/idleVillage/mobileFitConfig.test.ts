/**
 * mobileFitConfig — PLAN-083 (R-274).
 *
 * Copre il contratto zoom effettivo:
 *  - < breakpoint: `effectiveMin = max(coverScale, wheelMin)` (coverage
 *    primario, nessun letterbox nemmeno se coverScale > wheelMax);
 *    `effectiveMax = max(wheelMax, effectiveMin * mobileMaxZoomFactor)`.
 *  - >= breakpoint: la coppia wheel verbatim — emit-identical strutturale.
 *  - schema: rifiuta mobileMaxZoomFactor < mobileZoomRangeFloor e nav
 *    budget che non sta nel viewport di riferimento.
 */
import { describe, expect, it } from 'vitest';
import {
  getMobileFitConfig,
  isMobileFitViewport,
  mobileFitConfigSchema,
  resolveEffectiveZoomBounds,
} from '@/balancing/config/idleVillage/mobileFitConfig';

const WHEEL = { min: 0.18, max: 3 }; // cameraConfig del manifest wanderlust
const CANVAS = { w: 4240, h: 2828 };
const coverAt = (w: number, h: number) => Math.max(w / CANVAS.w, h / CANVAS.h);

const CFG = getMobileFitConfig();

describe('mobileFitConfig — schema', () => {
  it('defaults validi', () => {
    expect(() => mobileFitConfigSchema.parse(CFG)).not.toThrow();
    expect(CFG.breakpointPx).toBe(768);
    expect(CFG.minTargetPx).toBe(44);
    expect(CFG.panelMode).toBe('sheet');
  });

  it('rifiuta mobileMaxZoomFactor < mobileZoomRangeFloor (cross-field)', () => {
    expect(() =>
      mobileFitConfigSchema.parse({
        ...CFG,
        mobileMaxZoomFactor: 1.1,
        mobileZoomRangeFloor: 1.4,
      }),
    ).toThrow(/mobileMaxZoomFactor/);
  });

  it('rifiuta fattori non finiti o non positivi', () => {
    expect(() =>
      mobileFitConfigSchema.parse({ ...CFG, mobileMaxZoomFactor: 0 }),
    ).toThrow();
    expect(() =>
      mobileFitConfigSchema.parse({ ...CFG, mobileZoomRangeFloor: Number.NaN }),
    ).toThrow();
  });

  it('rifiuta navPrimaryIds che sforano il budget 390px', () => {
    expect(() =>
      mobileFitConfigSchema.parse({
        ...CFG,
        navPrimaryIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
      }),
    ).toThrow(/navPrimaryIds/);
  });
});

describe('resolveEffectiveZoomBounds — contratto PLAN-083', () => {
  it.each([
    { w: 360, h: 640 },
    { w: 390, h: 844 },
    { w: 430, h: 932 },
  ])('mobile $wx$h: coverage garantita e min ≤ max', ({ w, h }) => {
    const cover = coverAt(w, h);
    const b = resolveEffectiveZoomBounds(w, cover, WHEEL.min, WHEEL.max);
    expect(b.mobile).toBe(true);
    expect(b.min).toBeGreaterThanOrEqual(cover - 1e-9);
    expect(b.min).toBeLessThanOrEqual(b.max);
    expect(b.max / b.min).toBeGreaterThanOrEqual(CFG.mobileZoomRangeFloor);
  });

  it('coverScale > wheelMax: la copertura vince (nessun letterbox)', () => {
    // viewport quadruplo del canvas → cover > wheelMax: min sale oltre wheelMax
    const b = resolveEffectiveZoomBounds(390, 4.5, WHEEL.min, WHEEL.max);
    expect(b.min).toBeCloseTo(4.5);
    expect(b.max).toBeCloseTo(Math.max(WHEEL.max, 4.5 * CFG.mobileMaxZoomFactor));
  });

  it.each([
    { w: 768, h: 1024 },
    { w: 1024, h: 700 },
    { w: 1280, h: 800 },
    { w: 1440, h: 900 },
    { w: 3440, h: 1440 },
  ])('desktop $wx$h: coppia wheel verbatim (emit-identical)', ({ w, h }) => {
    const b = resolveEffectiveZoomBounds(w, coverAt(w, h), WHEEL.min, WHEEL.max);
    expect(b.mobile).toBe(false);
    expect(b.min).toBe(WHEEL.min);
    expect(b.max).toBe(WHEEL.max);
  });

  it('boundary: 767 mobile, 768 desktop', () => {
    expect(isMobileFitViewport(767)).toBe(true);
    expect(isMobileFitViewport(768)).toBe(false);
  });
});
