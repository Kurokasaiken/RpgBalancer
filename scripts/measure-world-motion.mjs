/**
 * Measures how much of the World Surface actually moves, per region.
 *
 * The question "does the map feel alive?" was answered by eye, and the eye kept
 * saying no while the code kept adding animations. This turns it into a number.
 *
 * The naive metric — count animations, or count changed pixels — is not the one
 * that matters. A ship crossing the map changes a lot of pixels in one small place
 * and leaves everything else temporally identical, which is exactly the profile
 * that reads as "static background with a moving object on it". So this reports
 * *coverage*: the share of each region that changes at all between two moments,
 * which is what separates surface motion from object motion.
 *
 * Animations are sampled by driving `Animation.currentTime` rather than by waiting.
 * A headless page throttles rAF and CSS animations, and the browser pane freezes
 * them outright at currentTime 0 when the document is hidden — waiting 5 seconds
 * and screenshotting twice reliably produces two identical images.
 *
 *   node scripts/measure-world-motion.mjs [url] [--delta 3] [--gap 5000]
 *
 * Acceptance target for the water field: at least 25% of the sea region shows a
 * change of >= 3 RGB points over a 5 second gap.
 */

import puppeteer from 'puppeteer';
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:5173/world-surface';
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(args[i + 1]);
};

/** A change smaller than this is compression noise, not motion. */
const DELTA = flag('delta', 3);
/** Simulated seconds between the two samples. */
const GAP_MS = flag('gap', 5000);
const OUT_DIR = 'test-results';

/**
 * Classifies a pixel as painted sea.
 *
 * Fixed viewport boxes were the obvious way to split the map into regions, and they
 * were wrong: the world renders at zoom 1 into a smaller viewport, so the camera
 * decides which part of the map a box lands on, and a "sea_east" box happily
 * measured the desert. Classifying by colour instead makes the sea metric
 * independent of where the camera happens to be pointing.
 *
 * The thresholds come from sampling Mare.webp's opaque pixels: mean RGB
 * (110, 136, 141), dominant colours clustered on #688888 / #789898 / #687888.
 * The sea is the only surface on this map that is desaturated toward blue-green
 * with red clearly the darkest channel — forest greens put green above blue,
 * desert puts red on top, and the grey mountains keep all three level.
 */
function isSea(r, g, b) {
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return b >= g - 8 && g > r + 10 && lum >= 95 && lum <= 175;
}

/**
 * Coarse viewport boxes, kept only for the non-sea readings. These say "is anything
 * at all happening in this part of the frame", which is still worth knowing even
 * though which part of the world they cover depends on the camera.
 */
const REGIONS = {
  top_band: { x0: 0.0, y0: 0.0, x1: 1.0, y1: 0.2 },
  middle_band: { x0: 0.0, y0: 0.4, x1: 1.0, y1: 0.6 },
  bottom_band: { x0: 0.0, y0: 0.8, x1: 1.0, y1: 1.0 },
  full: { x0: 0, y0: 0, x1: 1, y1: 1 },
};

/** Puts every running animation at an exact time, so two samples are comparable. */
async function seek(page, timeMs) {
  await page.evaluate((t) => {
    for (const a of document.getAnimations()) {
      try {
        a.pause();
        a.currentTime = t;
      } catch {
        /* an animation whose timeline has gone away — nothing to seek */
      }
    }
  }, timeMs);
  // One frame for the seek to be painted.
  await new Promise((r) => setTimeout(r, 120));
}

function coverage(a, b, box, width, height) {
  const x0 = Math.floor(box.x0 * width);
  const x1 = Math.ceil(box.x1 * width);
  const y0 = Math.floor(box.y0 * height);
  const y1 = Math.ceil(box.y1 * height);

  let changed = 0;
  let total = 0;
  let sum = 0;
  let peak = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const d = Math.max(
        Math.abs(a[i] - b[i]),
        Math.abs(a[i + 1] - b[i + 1]),
        Math.abs(a[i + 2] - b[i + 2]),
      );
      total++;
      sum += d;
      if (d > peak) peak = d;
      if (d >= DELTA) changed++;
    }
  }

  return {
    coverage: total ? changed / total : 0,
    meanDelta: total ? sum / total : 0,
    peakDelta: peak,
  };
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
// Layers are lazy and the tiles are fetched, so give the atmosphere time to mount.
await new Promise((r) => setTimeout(r, 4000));

const animations = await page.evaluate(() => {
  const names = {};
  for (const a of document.getAnimations()) {
    const n = a.animationName ?? 'unnamed';
    names[n] = (names[n] ?? 0) + 1;
  }
  return names;
});

await seek(page, 0);
const shotA = PNG.sync.read(await page.screenshot({ type: 'png' }));
await seek(page, GAP_MS);
const shotB = PNG.sync.read(await page.screenshot({ type: 'png' }));

await browser.close();

const { width, height } = shotA;
const results = {};
for (const [name, box] of Object.entries(REGIONS)) {
  results[name] = coverage(shotA.data, shotB.data, box, width, height);
}

mkdirSync(OUT_DIR, { recursive: true });
const report = { url, gapMs: GAP_MS, deltaThreshold: DELTA, viewport: { width, height }, animations, regions: results };
writeFileSync(`${OUT_DIR}/world-motion.json`, JSON.stringify(report, null, 2));

console.log(`\n${url}   gap ${GAP_MS}ms   delta >= ${DELTA}\n`);
console.log(`animations: ${Object.entries(animations).map(([k, v]) => `${k}x${v}`).join('  ')}\n`);
console.log('region            coverage    mean   peak');
for (const [name, r] of Object.entries(results)) {
  const pct = (r.coverage * 100).toFixed(1).padStart(6);
  console.log(
    `${name.padEnd(16)} ${pct}%  ${r.meanDelta.toFixed(2).padStart(6)}  ${String(r.peakDelta).padStart(5)}`,
  );
}

// The headline number: of the pixels that are painted sea, how many changed?
let seaPixels = 0;
let seaChanged = 0;
let seaSum = 0;
for (let i = 0; i < shotA.data.length; i += 4) {
  const r = shotA.data[i];
  const g = shotA.data[i + 1];
  const b = shotA.data[i + 2];
  if (!isSea(r, g, b)) continue;
  seaPixels++;
  const d = Math.max(
    Math.abs(r - shotB.data[i]),
    Math.abs(g - shotB.data[i + 1]),
    Math.abs(b - shotB.data[i + 2]),
  );
  seaSum += d;
  if (d >= DELTA) seaChanged++;
}

const seaCoverage = seaPixels ? seaChanged / seaPixels : 0;
const seaShare = seaPixels / (width * height);
report.sea = {
  pixels: seaPixels,
  shareOfFrame: seaShare,
  coverage: seaCoverage,
  meanDelta: seaPixels ? seaSum / seaPixels : 0,
};
writeFileSync(`${OUT_DIR}/world-motion.json`, JSON.stringify(report, null, 2));

console.log(
  `\nsea: ${seaPixels} px (${(seaShare * 100).toFixed(1)}% of frame)  ` +
    `mean delta ${report.sea.meanDelta.toFixed(2)}`,
);
console.log(`sea coverage: ${(seaCoverage * 100).toFixed(1)}%   target >= 25%`);
console.log(seaCoverage >= 0.25 ? 'PASS' : 'FAIL');
console.log(`\nreport: ${OUT_DIR}/world-motion.json`);
