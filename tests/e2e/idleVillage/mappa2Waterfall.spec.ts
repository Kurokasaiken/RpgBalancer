/**
 * mappa2Waterfall.spec.ts — PLAN-091 regression contract for the waterfall overlay.
 *
 * The overlay must (a) actually move — two frames apart must differ inside the
 * flow rect — and (b) never touch the painting — guard regions outside the
 * overlay must stay pixel-stable. Controls must be live (no app rebuild:
 * `effects`-style toggles would tear down the whole Pixi app via `fxKey`).
 *
 * Reduced motion freezes the overlay tick (t=0): the ROI must stay still.
 *
 * ROIs come from the pack contract (`pack.waterfall` rects, world px) projected
 * to screen through `window.__worldCam` (dev/playwright test seam) — never
 * hardcoded screen pixels.
 */
import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

const HUD = '[data-testid="mappa2-lab-hud"]';
const CANVAS = '[data-testid="pixi-world-canvas"]';

interface WfRects {
  flowRect: { x: number; y: number; width: number; height: number };
  impactRect: { x: number; y: number; width: number; height: number };
  basinRect: { x: number; y: number; width: number; height: number };
}
interface Cam { panX: number; panY: number; zoom: number; width: number; height: number }

const MEAN_DIFF_NOISE = 1.2;

const meanAbsDiff = (a: Buffer, b: Buffer): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i += 4) {
    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  return sum / (a.length / 4) / 3;
};

const cropPng = (png: PNG, x: number, y: number, w: number, h: number): Buffer => {
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, Math.round(x), Math.round(y), w, h, 0, 0);
  return out.data;
};

test.describe('mappa2 waterfall overlay (PLAN-091)', () => {
  test('flow scrolls, painting stays intact, controls are live (no rebuild)', async ({ page }) => {
    await page.goto('/mappa2-lab');
    await page.waitForFunction(
      () => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'),
      null,
      { timeout: 180_000 },
    );

    // Project the pack waterfall rects to screen space via the live camera seam.
    const rects = await page.evaluate(async (): Promise<{ wf: WfRects; cam: Cam }> => {
      const manifest = await fetch('/assets/world/mappa2/base/manifest.json').then((r) => r.json());
      const cam = (window as unknown as { __worldCam: Cam }).__worldCam;
      return { wf: manifest.pack.waterfall, cam };
    });
    const toScreen = (r: { x: number; y: number; width: number; height: number }) => ({
      x: (r.x - rects.cam.panX) * rects.cam.zoom,
      y: (r.y - rects.cam.panY) * rects.cam.zoom,
      w: r.width * rects.cam.zoom,
      h: r.height * rects.cam.zoom,
    });
    const flow = toScreen(rects.wf.flowRect);
    const basin = toScreen(rects.wf.basinRect);
    // Guard: painted rock strip left of the falls — overlay must never reach it.
    const guard = { x: flow.x - flow.w * 0.55, y: flow.y + flow.h * 0.3, w: flow.w * 0.3, h: flow.h * 0.35 };

    // Focus the waterfall so the ROI is on screen.
    await page.getByRole('button', { name: 'Cascata' }).click();
    await page.waitForTimeout(1800);

    // Re-read the camera after the glide and reproject.
    const cam2 = await page.evaluate(() => (window as unknown as { __worldCam: Cam }).__worldCam);
    const proj = (r: { x: number; y: number; width: number; height: number }) => ({
      x: (r.x - cam2.panX) * cam2.zoom,
      y: (r.y - cam2.panY) * cam2.zoom,
      w: r.width * cam2.zoom,
      h: r.height * cam2.zoom,
    });
    const flowS = proj(rects.wf.flowRect);
    const basinS = proj(rects.wf.basinRect);
    const guardS = {
      x: flowS.x - flowS.w * 0.55,
      y: flowS.y + flowS.h * 0.3,
      w: flowS.w * 0.3,
      h: flowS.h * 0.35,
    };

    const shotA = PNG.sync.read(await page.screenshot({ type: 'png' }));
    await page.waitForTimeout(400);
    const shotB = PNG.sync.read(await page.screenshot({ type: 'png' }));

    const flowDiff = meanAbsDiff(
      cropPng(shotA, flowS.x, flowS.y, Math.round(flowS.w), Math.round(flowS.h)),
      cropPng(shotB, flowS.x, flowS.y, Math.round(flowS.w), Math.round(flowS.h)),
    );
    const basinDiff = meanAbsDiff(
      cropPng(shotA, basinS.x, basinS.y, Math.round(basinS.w), Math.round(basinS.h)),
      cropPng(shotB, basinS.x, basinS.y, Math.round(basinS.w), Math.round(basinS.h)),
    );
    const guardDiff = meanAbsDiff(
      cropPng(shotA, guardS.x, guardS.y, Math.round(guardS.w), Math.round(guardS.h)),
      cropPng(shotB, guardS.x, guardS.y, Math.round(guardS.w), Math.round(guardS.h)),
    );

    expect(flowDiff, `flow rect must animate (mean|diff| ${flowDiff.toFixed(2)})`).toBeGreaterThan(MEAN_DIFF_NOISE);
    expect(basinDiff, `basin must ripple (mean|diff| ${basinDiff.toFixed(2)})`).toBeGreaterThan(MEAN_DIFF_NOISE);
    expect(guardDiff, `rock guard must stay painted-static (mean|diff| ${guardDiff.toFixed(2)})`).toBeLessThan(MEAN_DIFF_NOISE * 3);

    // Live controls: tag the app, flip the waterfall off, prove the app instance survived.
    const tag = await page.evaluate(() => {
      const app = (window as unknown as { __pixiApp?: Record<string, unknown> }).__pixiApp;
      if (app) app.__wfTag = (app.__wfTag as number) ?? Math.random();
      return (app?.__wfTag as number) ?? null;
    });
    await page.getByRole('button', { name: 'water', exact: true }).click();
    await page.locator('label', { hasText: 'waterfall' }).locator('input').uncheck();
    await page.waitForTimeout(300);
    const tagAfter = await page.evaluate(
      () => ((window as unknown as { __pixiApp?: Record<string, unknown> }).__pixiApp?.__wfTag as number) ?? null,
    );
    expect(tag).not.toBeNull();
    expect(tagAfter, 'waterfall toggle must not rebuild the Pixi app').toBe(tag);
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
    await page.getByRole('button', { name: 'Cascata' }).click();
    await page.waitForTimeout(1800);

    const rects = await page.evaluate(async () => {
      const manifest = await fetch('/assets/world/mappa2/base/manifest.json').then((r) => r.json());
      const cam = (window as unknown as { __worldCam: Cam }).__worldCam;
      return { wf: manifest.pack.waterfall as WfRects, cam };
    });
    const flowS = {
      x: (rects.wf.flowRect.x - rects.cam.panX) * rects.cam.zoom,
      y: (rects.wf.flowRect.y - rects.cam.panY) * rects.cam.zoom,
      w: rects.wf.flowRect.width * rects.cam.zoom,
      h: rects.wf.flowRect.height * rects.cam.zoom,
    };
    const shotA = PNG.sync.read(await page.screenshot({ type: 'png' }));
    await page.waitForTimeout(400);
    const shotB = PNG.sync.read(await page.screenshot({ type: 'png' }));
    const diff = meanAbsDiff(
      cropPng(shotA, flowS.x, flowS.y, Math.round(flowS.w), Math.round(flowS.h)),
      cropPng(shotB, flowS.x, flowS.y, Math.round(flowS.w), Math.round(flowS.h)),
    );
    expect(diff, `reduced-motion flow rect must stay frozen (mean|diff| ${diff.toFixed(2)})`).toBeLessThan(MEAN_DIFF_NOISE * 3);
    await ctx.close();
  });
});
