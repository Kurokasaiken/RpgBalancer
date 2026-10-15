/**
 * make-capsule.mts — composes Steam capsule art from a real /game map frame.
 *
 * Background: assets/candidates/capsule-bg-map-2910x1120.png (real /game
 * footage, UI chrome cropped, graded + vignette). Each Steam capsule size
 * gets its own crop rect inside that 2910×1120 canvas, then the AUTHORED
 * logo plaque (assets/library-logo.png — golden bar + central sun emblem,
 * native alpha) is composited on top with a readability scrim.
 *
 * Usage: npx tsx marketing/steam/tools/make-capsule.mts
 */

import { chromium } from '@playwright/test';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const BG = path.join(ROOT, 'marketing/steam/assets/candidates/capsule-bg-map-2910x1120.png');
const LOGO = path.join(ROOT, 'marketing/steam/assets/library-logo.png');
const OUT = path.join(ROOT, 'marketing/steam/assets');

/* Inline as data URIs — setContent pages can't load file:// subresources. */
const BG_URI = `data:image/png;base64,${readFileSync(BG).toString('base64')}`;
const LOGO_URI = `data:image/png;base64,${readFileSync(LOGO).toString('base64')}`;

/* Crop rect inside the 2910×1120 graded canvas (keeps village + quest
 * marker in frame), logo height per format. The logo asset is 1492×1023
 * with generous transparent padding (glow above, shadow below) — its
 * visible bar is ~40% of the image height. */
const JOBS = [
  {
    name: 'capsule-main-616x353.png',
    w: 616, h: 353,
    crop: { x: 623, y: 0, w: 1954, h: 1120 },
    logoH: 300,
  },
  {
    name: 'capsule-header-460x215.png',
    w: 460, h: 215,
    crop: { x: 400, y: 0, w: 2396, h: 1120 },
    logoH: 195,
  },
  {
    name: 'capsule-small-231x87.png',
    w: 231, h: 87,
    crop: { x: 0, y: 24, w: 2910, h: 1096 },
    logoH: 82,
  },
  {
    name: 'capsule-vertical-374x448.png',
    w: 374, h: 448,
    crop: { x: 1140, y: 60, w: 760, h: 970 - 60 },
    logoH: 250,
  },
  {
    name: 'event-capsule-800x450.png',
    w: 800, h: 450,
    crop: { x: 478, y: 10, w: 1954, h: 1099 },
    logoH: 380,
  },
  {
    /* Library hero: Steam overlays its own logo layer — no baked logo. */
    name: 'library-hero-3840x1240.png',
    w: 3840, h: 1240,
    crop: { x: 0, y: 80, w: 2910, h: 940 },
    logo: false,
  },
  {
    name: 'page-background-1438x810.png',
    w: 1438, h: 810,
    crop: { x: 461, y: 0, w: 1988, h: 1120 },
    logo: false,
  },
];

const browser = await chromium.launch();

for (const job of JOBS) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } });
  const { x, y, w, h } = job.crop;
  const scale = job.w / w;
  const logoBlock = job.logo === false ? '' : `
  <div class="scrim"></div>
  <img class="logo" src="${LOGO_URI}" style="height:${job.logoH}px">`;
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0">
<style>
  .frame { position: relative; width: ${job.w}px; height: ${job.h}px; overflow: hidden; }
  .bg { position: absolute; left: ${-x * scale}px; top: ${-y * scale}px;
        width: ${2910 * scale}px; height: ${1120 * scale}px; }
  .scrim { position: absolute; inset: 0;
    background: radial-gradient(ellipse 62% 50% at 50% 52%, rgba(8,12,20,.45) 0%, rgba(8,12,20,.22) 55%, transparent 78%); }
  .logo { position: absolute; left: 50%; top: 52%; transform: translate(-50%,-50%);
    filter: drop-shadow(0 4px 14px rgba(0,0,0,.55)); }
</style>
<div class="frame">
  <img class="bg" src="${BG_URI}">
  ${logoBlock}
</div></body></html>`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, job.name) });
  await page.close();
  console.log('✓', job.name);
}
await browser.close();
