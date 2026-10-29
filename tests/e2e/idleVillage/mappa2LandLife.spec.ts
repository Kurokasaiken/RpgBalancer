/**
 * mappa2LandLife.spec.ts — PLAN-093 regression contract for the ambient
 * land-life overlay (leaves/motes/flutter sprite pools).
 *
 * The overlay must (a) actually move — two frames apart must differ inside a
 * leaf/mote anchor ROI — and (b) never touch areas without anchors — the
 * volcanic massif guard must stay pixel-stable. The lab toggle must be live:
 * flipping `land life` hides the overlay without rebuilding the Pixi app.
 *
 * Reduced motion freezes animated pools (t=0): the ROI must stay still.
 *
 * ROIs come from the generated `land-life-anchors.json` (world px) projected to
 * screen through `window.__worldCam` (dev/playwright test seam) — never
 * hardcoded screen pixels.
 */
import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const EVIDENCE_DIR = 'test-results/plan-093-mappa2-ambient-land-life';
const saveShot = (name: string, png: PNG) => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(`${EVIDENCE_DIR}/${name}`, PNG.sync.write(png));
};

interface LlAnchor { id: string; x: number; y: number; biomeId: string; type: string; weight: number; radius: number }
interface Cam { panX: number; panY: number; zoom: number; width: number; height: number }
interface Rect { x: number; y: number; w: number; h: number }

const MEAN_DIFF_NOISE = 1.2;

const meanAbsDiff = (a: Buffer, b: Buffer): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i += 4) {
    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  return sum / (a.length / 4) / 3;
};

const cropPng = (png: PNG, x: number, y: number, w: number, h: number): Buffer => {
  // ROIs are projected world rects: after a camera glide they may extend past
  // the viewport — clamp to the image instead of failing bitblt.
  const cx = Math.min(Math.max(0, Math.round(x)), png.width - 1);
  const cy = Math.min(Math.max(0, Math.round(y)), png.height - 1);
  const cw = Math.max(1, Math.min(Math.round(x + w) - cx, png.width - cx));
  const ch = Math.max(1, Math.min(Math.round(y + h) - cy, png.height - cy));
  const out = new PNG({ width: cw, height: ch });
  PNG.bitblt(png, out, cx, cy, cw, ch, 0, 0);
  return out.data;
};

/** Bbox (world px) of anchors within `reach` of a focus point, padded. */
const roiAround = (anchors: LlAnchor[], fx: number, fy: number, reach: number, pad: number): Rect => {
  const near = anchors.filter((a) => Math.hypot(a.x - fx, a.y - fy) <= reach);
  if (!near.length) return { x: fx - pad, y: fy - pad, w: pad * 2, h: pad * 2 };
  const x0 = Math.min(...near.map((a) => a.x)) - pad;
  const y0 = Math.min(...near.map((a) => a.y)) - pad;
  return { x: x0, y: y0, w: Math.max(...near.map((a) => a.x)) + pad - x0, h: Math.max(...near.map((a) => a.y)) + pad - y0 };
};

const fetchScene = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const anchors = await fetch('/assets/world/mappa2/base/land-life-anchors.json').then((r) => r.json()) as { anchors: LlAnchor[] };
    const regions = await fetch('/assets/world/mappa2/base/regions.json').then((r) => r.json()) as { regions: { id: string; bounds: { x: number; y: number; width: number; height: number } }[] };
    const cam = (window as unknown as { __worldCam: Cam }).__worldCam;
    return { anchors: anchors.anchors, regions: regions.regions, cam };
  });

test.describe('mappa2 ambient land-life overlay (PLAN-093)', () => {
  test('anchors move, non-anchor guard stays intact, toggle is live (no rebuild)', async ({ page }) => {
    await page.goto('/mappa2-lab');
    await page.waitForFunction(
      () => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'),
      null,
      { timeout: 180_000 },
    );

    // Focus the bayou — leaf and mote anchors cluster there.
    await page.getByRole('button', { name: 'Bayou' }).click();
    await page.waitForTimeout(1800);

    const scene = await fetchScene(page);
    const cam = scene.cam;
    const proj = (r: Rect): Rect => ({ x: (r.x - cam.panX) * cam.zoom, y: (r.y - cam.panY) * cam.zoom, w: r.w * cam.zoom, h: r.h * cam.zoom });

    // Bayou focus preset lands at (0.25, 0.77) of the 2752x1536 canvas.
    const fx = 0.25 * 2752;
    const fy = 0.77 * 1536;
    const roi = proj(roiAround(scene.anchors.filter((a) => a.type !== 'flutter'), fx, fy, 460, 60));

    // Guard: volcanic massif interior — no land-life anchors, no canopy, no water.
    const volcano = scene.regions.find((r) => r.id === 'volcanic_massif')!.bounds;
    const guard = proj({ x: volcano.x + volcano.width * 0.3, y: volcano.y + volcano.height * 0.35, w: volcano.width * 0.4, h: volcano.height * 0.3 });

    const shotA = PNG.sync.read(await page.screenshot({ type: 'png' }));
    await page.waitForTimeout(450);
    const shotB = PNG.sync.read(await page.screenshot({ type: 'png' }));

    saveShot('ll-frame-a.png', shotA);
    saveShot('ll-frame-b.png', shotB);

    const roiDiff = meanAbsDiff(cropPng(shotA, roi.x, roi.y, roi.w, roi.h), cropPng(shotB, roi.x, roi.y, roi.w, roi.h));
    const guardDiff = meanAbsDiff(cropPng(shotA, guard.x, guard.y, guard.w, guard.h), cropPng(shotB, guard.x, guard.y, guard.w, guard.h));

    expect(roiDiff, `anchor ROI must animate (mean|diff| ${roiDiff.toFixed(2)})`).toBeGreaterThan(MEAN_DIFF_NOISE * 0.6);
    expect(guardDiff, `volcano guard must stay static (mean|diff| ${guardDiff.toFixed(2)})`).toBeLessThan(MEAN_DIFF_NOISE * 3);

    // Live toggle: tag the app, flip 'land life' off in the Land tab, app survives.
    const tag = await page.evaluate(() => {
      const app = (window as unknown as { __pixiApp?: Record<string, unknown> }).__pixiApp;
      if (app) app.__llTag = (app.__llTag as number) ?? Math.random();
      return (app?.__llTag as number) ?? null;
    });
    await page.getByRole('button', { name: 'land', exact: true }).click();
    await page.locator('label', { hasText: 'land life' }).locator('input').uncheck();
    await page.waitForTimeout(300);
    const tagAfter = await page.evaluate(
      () => ((window as unknown as { __pixiApp?: Record<string, unknown> }).__pixiApp?.__llTag as number) ?? null,
    );
    expect(tag).not.toBeNull();
    expect(tagAfter, 'land-life toggle must not rebuild the Pixi app').toBe(tag);

    // Deterministic: the overlay container must be hidden (ambient layers
    // still animate the ROI, so pixel-diff comparison would be fragile).
    const boxVisible = await page.evaluate(
      () => (window as unknown as { __landLifeBox?: { visible: boolean } }).__landLifeBox?.visible ?? null,
    );
    expect(boxVisible, 'land-life container must be hidden after toggle off').toBe(false);

    // Overlay hidden: ON→OFF pixel delta must exceed the ambient drift the
    // ROI still shows (canopy/foam keep moving, so measure the toggle delta
    // itself rather than OFF-frame stillness).
    const shotC = PNG.sync.read(await page.screenshot({ type: 'png' }));
    await page.waitForTimeout(450);
    const shotD = PNG.sync.read(await page.screenshot({ type: 'png' }));
    saveShot('ll-off.png', shotC);
    const offDiff = meanAbsDiff(cropPng(shotC, roi.x, roi.y, roi.w, roi.h), cropPng(shotD, roi.x, roi.y, roi.w, roi.h));
    const toggleDelta = meanAbsDiff(cropPng(shotA, roi.x, roi.y, roi.w, roi.h), cropPng(shotC, roi.x, roi.y, roi.w, roi.h));
    expect(toggleDelta, `toggle OFF must change pixels more than ambient drift (toggle ${toggleDelta.toFixed(2)} vs ambient ${offDiff.toFixed(2)})`).toBeGreaterThan(offDiff);
  });

  test('reduced motion freezes the overlay', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/mappa2-lab');
    await page.waitForFunction(
      () => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'),
      null,
      { timeout: 180_000 },
    );
    await page.getByRole('button', { name: 'Bayou' }).click();
    await page.waitForTimeout(1800);

    const scene = await fetchScene(page);
    const cam = scene.cam;
    const roi = (() => {
      const r = roiAround(scene.anchors.filter((a) => a.type !== 'flutter'), 0.25 * 2752, 0.77 * 1536, 460, 60);
      return { x: (r.x - cam.panX) * cam.zoom, y: (r.y - cam.panY) * cam.zoom, w: r.w * cam.zoom, h: r.h * cam.zoom };
    })();

    const shotA = PNG.sync.read(await page.screenshot({ type: 'png' }));
    await page.waitForTimeout(450);
    const shotB = PNG.sync.read(await page.screenshot({ type: 'png' }));
    const diff = meanAbsDiff(cropPng(shotA, roi.x, roi.y, roi.w, roi.h), cropPng(shotB, roi.x, roi.y, roi.w, roi.h));
    expect(diff, `reduced-motion ROI must stay frozen (mean|diff| ${diff.toFixed(2)})`).toBeLessThan(MEAN_DIFF_NOISE * 3);
    await ctx.close();
  });
});
