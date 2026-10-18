/**
 * questCinematics — e2e + evidence captures for PLAN-046 slice 1.
 *
 * Runs against /theater-lab on the built preview (5179). Covers the four
 * render paths (GPU depth, missing depth, forced no-WebGL, reduced motion)
 * and produces the frame strip the Director eye-checks:
 *   artifacts/cine-spike/*.png
 */

import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const LAB = '/theater-lab';
const OUT = join(process.cwd(), 'artifacts', 'cine-spike');
const METRICS_PATH = join(OUT, 'metrics.json');
const FRAME = '[data-testid="theater-lab-frame"]';

// Software WebGL for the GPU-path assertions: headless Chromium ships no GL
// adapter without this flag (Chrome ≥128), which would silently exercise the
// DOM fallback instead of the depth pipeline.
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });

/** Time-series evidence for the verification bundle (env + per-capture samples). */
const samples: Record<string, unknown>[] = [];
let envBlock: Record<string, unknown> | null = null;

/** Env attestation read in-page: visibility, rAF liveness, viewport,
 *  plus a real frameDiff — two live captures ~400ms apart must differ. */
async function attestEnv(page: Page): Promise<void> {
  const live = await page.evaluate(
    () =>
      new Promise<Record<string, unknown>>((resolve) => {
        let rafTicks = 0;
        const t0 = performance.now();
        const loop = () => {
          rafTicks += 1;
          if (performance.now() - t0 < 400) requestAnimationFrame(loop);
          else {
            resolve({
              visibilityState: document.visibilityState,
              viewport: { width: window.innerWidth, height: window.innerHeight },
              rafTicks,
              headed: false,
              webgl2: !!document.createElement('canvas').getContext('webgl2'),
              collectedAt: new Date().toISOString(),
            });
          }
        };
        requestAnimationFrame(loop);
      }),
  );
  const aBuf = await page.locator(FRAME).screenshot();
  await page.waitForTimeout(400);
  const bBuf = await page.locator(FRAME).screenshot();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'env-a.png'), aBuf);
  writeFileSync(join(OUT, 'env-b.png'), bBuf);
  const a = PNG.sync.read(aBuf);
  const b = PNG.sync.read(bBuf);
  const frameDiff =
    a.width === b.width && a.height === b.height
      ? pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 }) / (a.width * a.height)
      : 0;
  envBlock = { ...live, frameDiff };
}

function writeMetrics(): void {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    METRICS_PATH,
    JSON.stringify({ env: envBlock ?? { visibilityState: 'unknown' }, samples }, null, 2),
  );
}

/** Screenshot just the theater frame after the renderer settles. */
async function capture(page: Page, params: string, name: string): Promise<PNG> {
  await page.goto(`${LAB}?${params}`);
  await page.waitForSelector(FRAME);
  // textures load + first GPU frame + 240ms canvas fade-in
  await page.waitForTimeout(1200);
  const buf = await page.locator(FRAME).screenshot();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${name}.png`), buf);
  const canvasCount = await page.locator(`${FRAME} canvas`).count();
  samples.push({ capture: name, params, hasCanvas: canvasCount > 0, bytes: buf.length });
  writeMetrics();
  return PNG.sync.read(buf);
}

const hasCanvas = async (page: Page) => (await page.locator(`${FRAME} canvas`).count()) > 0;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  // looping verdict-zoom (1→1.12 in 900ms) — always mid-motion, frameDiff is real
  await page.goto(`${LAB}?scene=agguato-foresta&shot=verdict-zoom&t=loop`);
  await page.waitForSelector(FRAME);
  await page.waitForTimeout(1200);
  await attestEnv(page);
  writeMetrics();
  await page.close();
});

test.describe('questCinematics — render paths', () => {
  test('depth-enabled scene mounts the GPU canvas', async ({ page }) => {
    await page.goto(`${LAB}?scene=agguato-foresta&shot=push-in&t=800`);
    await page.waitForSelector(FRAME);
    await page.waitForTimeout(1200);
    const canvas = await hasCanvas(page);
    const imgs = await page.locator(`${FRAME} img`).count();
    samples.push({ test: 'depth-enabled', hasCanvas: canvas, imgs });
    writeMetrics();
    expect(canvas).toBe(true);
    // img stays mounted underneath (the fallback contract)
    expect(imgs).toBe(1);
  });

  test('missing-depth scene keeps the DOM path (no canvas)', async ({ page }) => {
    await page.goto(`${LAB}?scene=mercante&shot=push-in&t=800`);
    await page.waitForSelector(FRAME);
    await page.waitForTimeout(600);
    const canvas = await hasCanvas(page);
    const imgs = await page.locator(`${FRAME} img`).count();
    samples.push({ test: 'missing-depth', hasCanvas: canvas, imgs });
    writeMetrics();
    expect(canvas).toBe(false);
    expect(imgs).toBe(1);
  });

  test('forced no-WebGL falls back to the DOM image', async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error — simulate a WKWebView without WebGL2
      delete window.WebGL2RenderingContext;
    });
    await page.goto(`${LAB}?scene=agguato-foresta&shot=push-in&t=800`);
    await page.waitForSelector(FRAME);
    await page.waitForTimeout(600);
    const canvas = await hasCanvas(page);
    const imgs = await page.locator(`${FRAME} img`).count();
    samples.push({ test: 'forced-no-webgl', hasCanvas: canvas, imgs });
    writeMetrics();
    expect(canvas).toBe(false);
    expect(imgs).toBe(1);
  });

  test('reduced-motion never mounts the canvas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${LAB}?scene=agguato-foresta&shot=push-in&t=800`);
    await page.waitForSelector(FRAME);
    await page.waitForTimeout(600);
    const canvas = await hasCanvas(page);
    const imgs = await page.locator(`${FRAME} img`).count();
    samples.push({ test: 'reduced-motion', hasCanvas: canvas, imgs });
    writeMetrics();
    expect(canvas).toBe(false);
    expect(imgs).toBe(1);
  });
});

test.describe('questCinematics — evidence captures', () => {
  test('frame strip for the Director eye-check', async ({ page }) => {
    const shots: [string, string, number?][] = [
      ['push-in', 'push-t0', 0],
      ['push-in', 'push-t800', 800],
      ['push-in', 'push-end', 1600],
      ['pan-lateral', 'pan-mid', 3000],
      ['verdict-zoom', 'verdict-end', 900],
      ['idle', 'idle-mid', 8000],
      ['push-in', 'push-t800-ampx3', 800],
      ['push-in', 'push-t800-dom', 800],
      ['push-in', 'push-rest-dom', 0],
    ];
    for (const [shot, name, t] of shots) {
      const extra = name.includes('ampx3') ? '&amp=3' : '';
      const dom = name.includes('-dom') ? '&dom=1' : '';
      await capture(page, `scene=agguato-foresta&shot=${shot}&t=${t}${extra}${dom}`, name);
    }
    expect(existsSync(join(OUT, 'push-t800.png'))).toBe(true);
  });

  test('rest frame: GPU (amp=0) vs DOM are pixel-near-identical', async ({ page }) => {
    const gpu = await capture(page, 'scene=agguato-foresta&shot=hold&t=0&amp=0', 'parity-gpu-rest');
    const dom = await capture(page, 'scene=agguato-foresta&shot=hold&t=0&dom=1', 'parity-dom-rest');
    expect(gpu.width).toBe(dom.width);
    const diff = pixelmatch(gpu.data, dom.data, null, gpu.width, gpu.height, { threshold: 0.15 });
    const ratio = diff / (gpu.width * gpu.height);
    samples.push({ test: 'rest-parity', diffRatio: ratio });
    writeMetrics();
    // cross-renderer AA tolerates a small fraction; a wrong window would be >>5%
    expect(ratio).toBeLessThan(0.05);
  });

  test('mid-shot deformation is real — t=800 differs from rest and from amp=0', async ({ page }) => {
    const rest = await capture(page, 'scene=agguato-foresta&shot=push-in&t=0', 'proof-rest');
    const mid = await capture(page, 'scene=agguato-foresta&shot=push-in&t=800', 'proof-mid');
    const midFlat = await capture(page, 'scene=agguato-foresta&shot=push-in&t=800&amp=0', 'proof-mid-flat');
    const px = rest.width * rest.height;
    const dMotion = pixelmatch(rest.data, mid.data, null, rest.width, rest.height, { threshold: 0.15 }) / px;
    const dDepth = pixelmatch(midFlat.data, mid.data, null, rest.width, rest.height, { threshold: 0.15 }) / px;
    samples.push({ test: 'deformation-proof', dMotion, dDepth });
    writeMetrics();
    expect(dMotion).toBeGreaterThan(0.001); // the shot moved
    expect(dDepth).toBeGreaterThan(0.0005); // and the depth warp ≠ zoom-only
  });
});
