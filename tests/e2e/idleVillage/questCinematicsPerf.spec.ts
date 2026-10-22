/**
 * questCinematicsPerf — PLAN-050 OB-9: frame-time evidence on the
 * PRODUCTION build (vite preview 5179, not the dev server — T-09).
 *
 * Samples rAF deltas inside the live DepthScene loop on the heaviest
 * Goblin scene (entrance + full ambient + mid-trauma wobble) and writes
 * `artifacts/cine-showcase/perf.json`.
 *
 * NOTE: headless Chromium runs the depth shader on SwiftShader (software
 * GL) — measured times are an UPPER bound vs a real WebView/GPU. That is
 * stated in the artifact, not hidden.
 */
import { test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const OUT = join(process.cwd(), 'artifacts', 'cine-showcase');
const FRAMES = join(OUT, 'perf-frames');
const FRAME = '[data-testid="theater-lab-frame"]';

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });

interface Sample {
  scene: string;
  variant: string;
  frames: number;
  p50: number;
  p95: number;
  p99: number;
  fpsP95: number;
}

const pct = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];

async function sampleRaf(page: import('@playwright/test').Page, ms: number): Promise<number[]> {
  return page.evaluate(
    (sampleMs) =>
      new Promise<number[]>((resolve) => {
        const ds: number[] = [];
        let last = performance.now();
        const t0 = last;
        const loop = (now: number) => {
          ds.push(now - last);
          last = now;
          if (now - t0 < sampleMs) requestAnimationFrame(loop);
          else resolve(ds);
        };
        requestAnimationFrame(loop);
      }),
    ms,
  );
}

function toSample(scene: string, variant: string, deltas: number[]): Sample {
  const sorted = [...deltas].sort((a, b) => a - b);
  const p95 = pct(sorted, 0.95);
  return {
    scene,
    variant,
    frames: deltas.length,
    p50: pct(sorted, 0.5),
    p95,
    p99: pct(sorted, 0.99),
    fpsP95: Math.round(1000 / p95),
  };
}

async function measure(page: import('@playwright/test').Page, params: string, variant: string, ms = 4000): Promise<Sample> {
  await page.goto(`/theater-lab?${params}`);
  await page.waitForSelector(FRAME);
  await page.waitForTimeout(1200);
  const deltas = await sampleRaf(page, ms);
  /* the frame the numbers describe — written next to the metrics so the
   *  fps gate can bind evidence to real captures, not only a json claim. */
  mkdirSync(FRAMES, { recursive: true });
  writeFileSync(join(FRAMES, `${variant}.png`), await page.locator(FRAME).screenshot());
  return toSample(params.split('scene=')[1]?.split('&')[0] ?? '?', variant, deltas);
}

test('PLAN-050 perf — depth-parallax loop on the production build', async ({ page }) => {
  const samples: Sample[] = [];
  /* heaviest shipped combo: full-res entrance with every ambient fx on */
  samples.push(await measure(page, 'scene=assalto-goblin&shot=enter-direct&t=loop', 'entrance-loop+ambient'));
  /* trauma mid-flight on the same scene — the shake! button injects the
   *  trauma epoch live, then we sample the wobble window (~1.5s). */
  await page.goto('/theater-lab?scene=assalto-goblin&shot=hold');
  await page.waitForSelector(FRAME);
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /shake!/ }).click();
  const traumaDeltas = await sampleRaf(page, 1500);
  mkdirSync(FRAMES, { recursive: true });
  writeFileSync(join(FRAMES, 'hold+trauma.png'), await page.locator(FRAME).screenshot());
  samples.push(toSample('assalto-goblin', 'hold+trauma', traumaDeltas));
  /* ambient-heavy camp in pose */
  samples.push(await measure(page, 'scene=accampamento-raider&shot=pose-watch&t=loop', 'pose+ambient'));

  /* Env attestation for the verification gate — collected on a looping
   *  verdict-zoom (guaranteed mid-motion, light enough for SwiftShader):
   *  visibility, viewport, rAF liveness and a real frameDiff between two
   *  captures ~400ms apart. */
  await page.goto('/theater-lab?scene=agguato-foresta&shot=verdict-zoom&t=loop');
  await page.waitForSelector(FRAME);
  await page.waitForTimeout(800);
  const env = await page.evaluate(() => ({
    visibilityState: document.visibilityState,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    headed: false,
    webgl2: !!document.createElement('canvas').getContext('webgl2'),
  }));
  const aBuf = await page.locator(FRAME).screenshot();
  await page.waitForTimeout(400);
  const bBuf = await page.locator(FRAME).screenshot();
  mkdirSync(FRAMES, { recursive: true });
  writeFileSync(join(FRAMES, 'env-attestation-a.png'), aBuf);
  writeFileSync(join(FRAMES, 'env-attestation-b.png'), bBuf);
  const a = PNG.sync.read(aBuf);
  const b = PNG.sync.read(bBuf);
  const frameDiff =
    a.width === b.width && a.height === b.height
      ? pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 }) / (a.width * a.height)
      : 0;

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    join(OUT, 'perf.json'),
    JSON.stringify(
      {
        collectedAt: new Date().toISOString(),
        build: 'vite preview (dist-playwright, production mode)',
        renderer: 'SwiftShader software WebGL — UPPER BOUND vs a real GPU/WebView',
        env: {
          ...env,
          rafTicks: samples.reduce((n, s) => n + s.frames, 0),
          frameDiff,
        },
        samples,
      },
      null,
      2,
    ),
  );
  for (const s of samples) {
    console.log(`[perf] ${s.scene} ${s.variant}: p50=${s.p50.toFixed(1)}ms p95=${s.p95.toFixed(1)}ms (${s.fpsP95}fps) p99=${s.p99.toFixed(1)}ms n=${s.frames}`);
  }
});
