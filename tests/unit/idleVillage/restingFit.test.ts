import { describe, expect, it } from 'vitest';
import {
  restingFit,
  type ScreenRect,
} from '@/ui/idleVillage/pixiSpike/restingFit';
import { MAPPA2_APRON, MAPPA2_FIT_MEASUREMENTS } from '@/ui/idleVillage/config/mappa2FitConfig';

const CANVAS = MAPPA2_FIT_MEASUREMENTS.canvas;
const LAND = MAPPA2_FIT_MEASUREMENTS.landBounds;
const APRON = MAPPA2_APRON;
const GAP_PX = 8;

/** Representative fixed-chrome fixture for the PLAN-135 §1 matrix (time/resources/events/nav; no floating panels, no narrator). */
const chromeFor = (viewportW: number, viewportH: number): ScreenRect[] => {
  const k = viewportW >= 2560 ? 1.3 : viewportW >= 1920 ? 1.1 : 1;
  const time = { width: 382 * k, height: 49 * k };
  const resources = { width: 381 * k, height: 62 * k };
  const events = { width: 348, height: 66 };
  const nav = { width: 345 * k, height: 88 * k };
  return [
    { id: 'time', x: 58 * k, y: 12, width: time.width, height: time.height },
    { id: 'resources', x: (viewportW - resources.width) / 2, y: 12, width: resources.width, height: resources.height },
    { id: 'events', x: viewportW - 12 - events.width, y: 10, width: events.width, height: events.height },
    { id: 'nav', x: (viewportW - nav.width) / 2, y: viewportH - 6 - nav.height, width: nav.width, height: nav.height },
  ];
};

const intersects = (
  a: { x0: number; y0: number; x1: number; y1: number },
  b: ScreenRect,
): boolean => a.x0 < b.x + b.width && a.x1 > b.x && a.y0 < b.y + b.height && a.y1 > b.y;

describe('restingFit — PLAN-135 §1 viewport matrix', () => {
  it.each([
    { label: '1280x720', viewport: { width: 1280, height: 720 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '1366x768', viewport: { width: 1366, height: 768 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '1440x900', viewport: { width: 1440, height: 900 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '1536x864', viewport: { width: 1536, height: 864 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '1920x1080', viewport: { width: 1920, height: 1080 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '1920x1200', viewport: { width: 1920, height: 1200 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '2000x1024 Director', viewport: { width: 2000, height: 1024 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '2560x1440', viewport: { width: 2560, height: 1440 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '2560x1080 21:9', viewport: { width: 2560, height: 1080 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
    { label: '3440x1440 21:9', viewport: { width: 3440, height: 1440 }, maxNeed: { top: 200, side: 560, bottom: 0 } },
  ])('$label keeps land clear of fixed chrome and the visible frame inside canvas+apron', ({ viewport, maxNeed }) => {
    const chrome = chromeFor(viewport.width, viewport.height);
    const fit = restingFit({ viewport, chromeRects: chrome, landBounds: LAND, canvas: CANVAS, apron: APRON, chromeGapPx: GAP_PX });

    expect(fit.status).toBe('LAND_CLEAR');
    expect(fit.landClipPx).toBe(0);
    expect(fit.zoom).toBeCloseTo(fit.zLand, 10);
    expect(fit.zoom).toBeGreaterThanOrEqual(fit.zFrame);
    for (const rect of chrome) expect(intersects(fit.projectedLand, rect)).toBe(false);
    expect(fit.visibleFrame.x0).toBeGreaterThanOrEqual(-APRON.left - 1e-9);
    expect(fit.visibleFrame.x1).toBeLessThanOrEqual(CANVAS.width + APRON.right + 1e-9);
    expect(fit.visibleFrame.y0).toBeGreaterThanOrEqual(-APRON.top - 1e-9);
    expect(fit.visibleFrame.y1).toBeLessThanOrEqual(CANVAS.height + APRON.bottom + 1e-9);
    expect(fit.apronNeeded.top).toBeLessThanOrEqual(maxNeed.top);
    expect(fit.apronNeeded.left).toBeLessThanOrEqual(maxNeed.side);
    expect(fit.apronNeeded.right).toBeLessThanOrEqual(maxNeed.side);
    expect(fit.apronNeeded.bottom).toBeLessThanOrEqual(maxNeed.bottom);
  });


  it('uses horizontal holes in fixed chrome when they permit a larger full-land fit', () => {
    const fit = restingFit({
      viewport: { width: 1000, height: 1000 },
      chromeRects: [{ id: 'top-right', x: 500, y: 0, width: 500, height: 100 }],
      landBounds: { x0: 0, y0: 0, x1: 300, y1: 800 },
      canvas: { width: 2000, height: 2000 },
      apron: { top: 0, right: 0, bottom: 0, left: 0 },
      chromeGapPx: 0,
    });

    // Full-land visibility caps zoom at 1000/800 = 1.25. A purely vertical
    // free-strip fit would cap at 900/800 = 1.125, but the projected land is
    // narrow enough to sit left of the top-right chrome rectangle.
    expect(fit.zLand).toBeCloseTo(1.25, 5);
    expect(intersects(fit.projectedLand, { id: 'top-right', x: 500, y: 0, width: 500, height: 100 })).toBe(false);
  });
  it('reports LAND_CLIPPED_BY_CLAMP when the frame containment floor beats the land fit', () => {
    const chrome = chromeFor(1280, 720);
    const fit = restingFit({
      viewport: { width: 1280, height: 720 },
      chromeRects: chrome,
      landBounds: LAND,
      canvas: CANVAS,
      apron: { top: 0, right: 0, bottom: 0, left: 0 },
      chromeGapPx: GAP_PX,
    });
    expect(fit.status).toBe('LAND_CLIPPED_BY_CLAMP');
    expect(fit.zoom).toBe(fit.zFrame);
    expect(fit.landClipPx).toBeGreaterThan(0);
  });

  it('uses conservative floor/ceil rounding for visible-frame containment', () => {
    const chrome = chromeFor(1280, 720);
    const fit = restingFit({
      viewport: { width: 1280, height: 720 },
      chromeRects: chrome,
      landBounds: LAND,
      canvas: CANVAS,
      apron: APRON,
      chromeGapPx: GAP_PX,
    });
    expect(fit.visibleFrameRounded.x0).toBe(Math.floor(fit.visibleFrame.x0));
    expect(fit.visibleFrameRounded.y0).toBe(Math.floor(fit.visibleFrame.y0));
    expect(fit.visibleFrameRounded.x1).toBe(Math.ceil(fit.visibleFrame.x1));
    expect(fit.visibleFrameRounded.y1).toBe(Math.ceil(fit.visibleFrame.y1));
  });
});
