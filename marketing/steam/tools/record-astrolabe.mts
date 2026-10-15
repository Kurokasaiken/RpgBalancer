/**
 * record-astrolabe.mts — Steam media: Destiny Astrolabe full-animation clip.
 *
 * Records the canonical V1 `DestinyAstrolabe` (same component wired into
 * `MilestoneCheckModal` on `/game`) from the dev page `/minimal-destiny-astrolabe`,
 * which auto-starts a roll on load. Captures the whole beat: arm → THROW →
 * spin → magnetic snap → verdict flash, plus a short tail on the settled star.
 *
 * Usage: npx tsx marketing/steam/tools/record-astrolabe.mts
 * Requires the Vite dev server on :5173 (`npm run dev`).
 * Output: test-results/steam-capture/astrolabe.webm (video dir) + logs the
 * board bounding box for the ffmpeg crop step.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'test-results/steam-capture');
const URL = 'http://localhost:5173/minimal-destiny-astrolabe';
const RECORD_MS = 26_000;

const run = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });

  /* Clean the frame for the marketing clip: hide the test-hub chrome (title
   * bar, skill pills, variant rows) and the component's dev toggles/legend.
   * The board then stretches to fill the viewport — same component, same
   * overlays the in-game MilestoneCheckModal shows. */
  await page.evaluate(() => {
    const board = document.querySelector('#arena')?.closest('.flex-1') as HTMLElement | null;
    const col = board?.parentElement;
    if (col) {
      for (const c of Array.from(col.children)) {
        if (c !== board) (c as HTMLElement).style.display = 'none';
      }
    }
  });
  await page.addStyleTag({
    content: `
      fieldset, .da-legend-toggle, .da-legend, [class*="legend"] { display: none !important; }
    `,
  });

  // Measure the astrolabe board rect so the clip can be cropped to the wheel.
  const box = await page.evaluate(() => {
    const el = document.querySelector('#arena') ?? document.querySelector('.da-wrap canvas');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  console.log('board box @css px:', JSON.stringify(box));

  /* autoStart arms the wheel but the throw is a player action — hold the
   * armed beat, then click THROW like a player would. */
  await page.locator('.da-tira').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(1_800); // armed beat
  await page.locator('.da-tira').click();
  await page.waitForTimeout(RECORD_MS);
  await context.close();
  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
