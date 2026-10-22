/**
 * questCinematicsShowcase — PLAN-050 evidence captures.
 *
 * The Director's eye-check strip for the ingresso × posa grammar plus the
 * juice channels (letterbox, trauma shake). Runs against /theater-lab on
 * the built preview (5179) with frozen clocks — every frame is
 * deterministic.
 *   artifacts/cine-showcase/*.png
 */
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { SCENE_CINEMATICS } from '../../../src/ui/idleVillage/questS1Lab/render/sceneManifest';
import { DEFAULT_QUEST_THEATRE_FX } from '../../../src/balancing/config/idleVillage/quests/questTheatreFx';

const LAB = '/theater-lab';
const OUT = process.env.CINE_SHOWCASE_OUT ?? join(process.cwd(), 'artifacts', 'cine-showcase');
const METRICS_PATH = join(OUT, 'metrics.json');
const FRAME = '[data-testid="theater-lab-frame"]';
const LAB_TEMPO = 3;

// Software WebGL — headless Chromium has no GL adapter without it.
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });

/** Time-series evidence for the verification bundle (env + per-capture samples). */
const samples: Record<string, unknown>[] = [];
let envBlock: Record<string, unknown> | null = null;

/** Env attestation read in-page (same contract as the cine-spike spec):
 *  visibility, rAF liveness, viewport, plus a real frameDiff. */
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
  const aBuf = await page.locator(FRAME).screenshot({ timeout: 15000 });
  await page.waitForTimeout(400);
  const bBuf = await page.locator(FRAME).screenshot({ timeout: 15000 });
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

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  // looping verdict-zoom — always mid-motion, frameDiff is real (the light
  // scene keeps SwiftShader from starving the screenshot, same as the spike)
  await page.goto(`${LAB}?scene=agguato-foresta&shot=verdict-zoom&t=loop`);
  await page.waitForSelector(FRAME);
  await page.waitForTimeout(1200);
  mkdirSync(OUT, { recursive: true });
  await attestEnv(page);
  writeMetrics();
  await page.close();
});

const SHOT_MS = (id: string) =>
  (DEFAULT_QUEST_THEATRE_FX.camera.shots[id as never]?.durMs ?? 1600) * LAB_TEMPO;

/** The Goblin scene set with a depth map + authored ingresso × posa pair. */
const GOBLIN_SCENES = Object.entries(SCENE_CINEMATICS)
  .filter(([, e]) => e.entrance || e.pose)
  .map(([id, e]) => ({ id, entrance: e.entrance!, pose: e.pose! }));

async function capture(page: Page, params: string, name: string): Promise<void> {
  await page.goto(`${LAB}?${params}`);
  await page.waitForSelector(FRAME);
  await page.waitForTimeout(1200); // textures + first GPU frame + canvas fade-in
  const buf = await page.locator(FRAME).screenshot();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${name}.png`), buf);
  const canvasCount = await page.locator(`${FRAME} canvas`).count();
  samples.push({ capture: name, params, hasCanvas: canvasCount > 0, bytes: buf.length });
  writeMetrics();
}

test.describe('PLAN-050 showcase — ingresso × posa per scena', () => {
  test('frozen camera clock advances from entrance start to landing', async ({ page }) => {
    const dur = SHOT_MS('enter-sweep');
    await page.goto(`${LAB}?scene=agguato-foresta&shot=enter-sweep&t=0&dust=0`);
    await page.waitForSelector(`${FRAME} canvas`);
    await page.waitForTimeout(1000);
    const startBuf = await page.locator(FRAME).screenshot();
    const start = PNG.sync.read(startBuf);
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, 'frozen-start.png'), startBuf);

    await page.goto(`${LAB}?scene=agguato-foresta&shot=enter-sweep&t=${dur}&dust=0`);
    await page.waitForSelector(`${FRAME} canvas`);
    await page.waitForTimeout(1000);
    const landedBuf = await page.locator(FRAME).screenshot();
    const landed = PNG.sync.read(landedBuf);
    writeFileSync(join(OUT, 'frozen-landed.png'), landedBuf);
    expect(landed.width).toBe(start.width);
    expect(landed.height).toBe(start.height);
    const diff = pixelmatch(start.data, landed.data, null, start.width, start.height, { threshold: 0.1 });
    const frameDiff = diff / (start.width * start.height);
    expect(frameDiff).toBeGreaterThan(0.02);
    samples.push(
      {
        capture: 'frozen-start',
        file: 'frozen-start.png',
        elapsedMs: 0,
        frameDiff: 0,
        width: start.width,
        height: start.height,
        hasCanvas: true,
      },
      {
        capture: 'frozen-landed',
        file: 'frozen-landed.png',
        elapsedMs: dur,
        frameDiff,
        width: landed.width,
        height: landed.height,
        hasCanvas: true,
      },
    );
    writeMetrics();
  });

  test('authored entrance × pose strip for every Goblin scene', async ({ page }) => {
    test.setTimeout(240000);
    expect(GOBLIN_SCENES.length).toBeGreaterThanOrEqual(8);
    for (const s of GOBLIN_SCENES) {
      const dur = SHOT_MS(s.entrance);
      const poseDur = SHOT_MS(s.pose);
      /* mid-flight: the entrance personality mid-move (wider, off-axis) */
      await capture(page, `scene=${s.id}&shot=${s.entrance}&t=${Math.round(dur * 0.45)}`, `${s.id}-1-ingresso-mid`);
      /* landed: the frame composed, right at settle */
      await capture(page, `scene=${s.id}&shot=${s.entrance}&t=${dur + 400}`, `${s.id}-2-ingresso-landed`);
      /* the authored hold pose at rest */
      await capture(page, `scene=${s.id}&shot=${s.pose}&t=${poseDur + 800}`, `${s.id}-3-posa`);
    }
  });

  test('letterbox descends with the entrance and persists into the pose', async ({ page }) => {
    const dur = SHOT_MS('enter-settle-cover');
    await capture(page, `scene=accampamento-raider&shot=enter-settle-cover&t=${Math.round(dur * 0.4)}&bars=ingresso`, 'bande-ingresso-discesa');
    await capture(page, `scene=accampamento-raider&shot=enter-settle-cover&t=${dur + 400}&bars=ingresso`, 'bande-ingresso-complete');
    await capture(page, `scene=accampamento-raider&shot=pose-watch&t=2500&bars=fisse`, 'bande-fisse-posa');
    await capture(page, `scene=ritorno&shot=enter-sweep&t=${Math.round(SHOT_MS('enter-sweep') * 0.4)}&bars=ingresso`, 'bande-ritorno-discesa');
  });

  test('trauma shake — GPU depth-weighted vs DOM degraded vs decay', async ({ page }) => {
    /* t frozen mid-wobble: amp = strength²·e^{−t/decay} is deterministic */
    await capture(page, 'scene=assalto-goblin&shot=hold&t=0&shake=1', 'shake-impatto-t0');
    await capture(page, 'scene=assalto-goblin&shot=hold&t=150&shake=1', 'shake-impatto-t150');
    await capture(page, 'scene=assalto-goblin&shot=hold&t=600&shake=1', 'shake-decaduto-t600');
    await capture(page, 'scene=assalto-goblin&shot=hold&t=150&shake=1&dom=1', 'shake-dom-degraded');
    await capture(page, 'scene=agguato-foresta&shot=pose-watch&t=2000&shake=0.5', 'shake-colpo-posa');
  });

  test('rest frame stays readable — no wobble with shake decayed', async ({ page }) => {
    await capture(page, `scene=assalto-goblin&shot=pose-tense&t=${SHOT_MS('pose-tense') + 800}`, 'posa-tesa-assalto');
    await capture(page, `scene=saccheggio&shot=pose-rest&t=${SHOT_MS('pose-rest') + 800}`, 'posa-riposo-saccheggio');
  });

  test('reduced motion — no canvas, no bars, no shake; the still frame only', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await capture(page, 'scene=assalto-goblin&shot=enter-direct&t=800&shake=1&bars=ingresso', 'reduced-motion-ingresso');
    const canvases = await page.locator(`${FRAME} canvas`).count();
    expect(canvases).toBe(0);
    /* the DOM img is the only layer — reduced motion means no effects at all */
    const imgs = await page.locator(`${FRAME} img`).count();
    expect(imgs).toBe(1);
  });

  /* OB-5 — every lab control acts in place: no navigation, state applied. */
  test('lab controls — scene/entrance/pose/bars/shake act without navigation', async ({ page }) => {
    await page.goto(`${LAB}?scene=accampamento-raider&shot=enter-settle-cover`);
    await page.waitForSelector(FRAME);
    await page.waitForSelector('canvas', { timeout: 30000 });
    const url = page.url();
    const controls = page.getByTestId('theater-lab-controls');

    await controls.getByRole('button', { name: 'fuga-goblin' }).click();
    await controls.getByRole('button', { name: /^direct/ }).click();
    await controls.getByRole('button', { name: /^tense/ }).click();
    await controls.getByRole('button', { name: "con l'ingresso" }).click();
    await controls.getByRole('button', { name: 'impatto' }).click();
    await controls.getByRole('button', { name: /shake!/ }).click();

    expect(page.url()).toBe(url); // zero navigations — everything is in place
    /* the status line mirrors the applied state (scene · shot) */
    await expect(page.getByText(/fuga-goblin · pose-tense/)).toBeVisible();
    /* the GPU layer is still mounted after the shake! injection */
    await expect(page.locator(`${FRAME} canvas:not([data-testid="ambient-layer"])`)).toBeVisible();
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, 'lab-controls-applied.png'), await page.locator(FRAME).screenshot());
  });
});
