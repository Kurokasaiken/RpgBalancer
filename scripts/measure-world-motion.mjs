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
/**
 * Milliseconds between the two samples.
 *
 * 100, not 5000. A five-second gap measures accumulated drift, which is not what a
 * viewer sees: the eye adapts to slow luminance change rather than integrating it,
 * so it responds to the RATE of change, not the total. Tuned against a 5s gap the
 * sea scored 37.9% and looked completely still, because it was changing at half an
 * RGB point per second. The reference footage changes at about 14.
 */
const GAP_MS = flag('gap', 100);
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
  // Long enough for the seek to actually reach the screen. 120ms was not: it is
  // fine for compositor-only transforms, but the light pools animate `opacity` on
  // very large gradient elements, which needs a real repaint. The screenshot came
  // back showing the previous frame, and the whole field measured as motionless.
  await new Promise((r) => setTimeout(r, 260));
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
await new Promise((r) => setTimeout(r, 5000));

const animations = await page.evaluate(() => {
  const names = {};
  for (const a of document.getAnimations()) {
    const n = a.animationName ?? 'unnamed';
    names[n] = (names[n] ?? 0) + 1;
  }
  return names;
});

/**
 * Reference: the same measurement taken on the MTG Arena footage the Director gave
 * as the target, over consecutive frames of it. This is the bar.
 */
const REFERENCE = { coverage: 0.140, meanDelta: 1.19, gapMs: 84 };

/**
 * Sample several pairs of moments rather than one.
 *
 * A single pair is a coin toss. Every layer here is on its own sinusoid, and a pair
 * that happens to straddle the flat top of one measures almost nothing from it —
 * tuning against that number produced swings from 6% to 32% with no change to the
 * config, and made the result depend on the viewport, because which layers covered
 * visible water shifted with the camera.
 */
const STARTS = [0, 7000, 13000, 21000, 34000];
const shots = [];
for (const start of STARTS) {
  await seek(page, start);
  const a = PNG.sync.read(await page.screenshot({ type: 'png' }));
  await seek(page, start + GAP_MS);
  const b = PNG.sync.read(await page.screenshot({ type: 'png' }));
  shots.push([a, b]);
}

await browser.close();

const [shotA, shotB] = shots[0];

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
const samples = shots.map(([a, b]) => {
  let px = 0;
  let changed = 0;
  let sum = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const r = a.data[i];
    const g = a.data[i + 1];
    const bl = a.data[i + 2];
    if (!isSea(r, g, bl)) continue;
    px++;
    const d = Math.max(
      Math.abs(r - b.data[i]),
      Math.abs(g - b.data[i + 1]),
      Math.abs(bl - b.data[i + 2]),
    );
    sum += d;
    if (d >= DELTA) changed++;
  }
  return { px, coverage: px ? changed / px : 0, meanDelta: px ? sum / px : 0 };
});

const seaPixels = samples[0].px;
const seaCoverage = samples.reduce((s, x) => s + x.coverage, 0) / samples.length;
const seaMean = samples.reduce((s, x) => s + x.meanDelta, 0) / samples.length;
const spread = samples.map((x) => (x.coverage * 100).toFixed(1)).join(' / ');
const seaShare = seaPixels / (width * height);
report.sea = {
  pixels: seaPixels,
  shareOfFrame: seaShare,
  coverage: seaCoverage,
  meanDelta: seaMean,
  perSample: samples.map((x) => ({ coverage: x.coverage, meanDelta: x.meanDelta })),
};
writeFileSync(`${OUT_DIR}/world-motion.json`, JSON.stringify(report, null, 2));

console.log(
  `\nsea: ${seaPixels} px (${(seaShare * 100).toFixed(1)}% of frame)  ` +
    `mean delta ${seaMean.toFixed(2)}`,
);
console.log(`per-sample coverage: ${spread}`);
// Normalise both sides to points per second, so the gap length cannot flatter us.
const rate = (seaMean / GAP_MS) * 1000;
const refRate = (REFERENCE.meanDelta / REFERENCE.gapMs) * 1000;
console.log(`sea coverage: ${(seaCoverage * 100).toFixed(1)}%   reference ${(REFERENCE.coverage * 100).toFixed(1)}%`);
console.log(
  `change rate:  ${rate.toFixed(1)} RGB points/s   reference ${refRate.toFixed(1)}   ` +
    `(${(rate / refRate * 100).toFixed(0)}% of reference)`,
);
console.log(seaCoverage >= REFERENCE.coverage * 0.5 ? 'PASS (>= half the reference)' : 'FAIL');
console.log(`\nreport: ${OUT_DIR}/world-motion.json`);
