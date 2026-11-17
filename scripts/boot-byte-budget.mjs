#!/usr/bin/env node
// PLAN-126 T-A1 (OB-1): HAR capture + per-category byte budget for the /game
// cold boot. Same WebGL path as scripts/deploy/webglBootProbe.mjs
// (`--enable-unsafe-swiftshader`) so the probe exercises the real renderer.
//
// Boot is DONE when `window.__gameBoot.interactiveMs` is stamped — the veil has
// lifted and the full R-166 preload set has been fetched.
//
// Usage:
//   node scripts/boot-byte-budget.mjs [url] [outDir]
// Env:
//   BOOT_PROBE_TIMEOUT_MS (default 300000)
//
// Outputs in <outDir>:
//   boot.har          — raw HAR artifact (kept for cross-checks / T-A3 design)
//   har-budget.json   — per-category {requests, wireBytes, bodyBytes, maxMs} +
//                       totals + unclassified tail + meta (url, interactiveMs)

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2] ?? 'https://rpg-balancer.vercel.app/game';
const outDir = process.argv[3] ?? '.mw/runs/plan126-boot-bytes';
const TIMEOUT_MS = Number(process.env.BOOT_PROBE_TIMEOUT_MS ?? 300000);
const POLL_MS = 2000;

mkdirSync(outDir, { recursive: true });
const harPath = path.join(outDir, 'boot.har');

// Category rules ordered by specificity — first match wins. Patterns mirror the
// on-disk layout under public/assets (see T-A1 notes in the plan). The OB-1 set
// is tiles/poses/canopies/flips/clouds/ui/cursors/masks/json/js; the extra
// buckets below keep 'other' honest (village plates, surface layers, atmosphere,
// bundled media) instead of hiding 60% of the bytes in one tail.
const CATEGORY_RULES = [
  ['cursors', /\/assets\/ui\/cursors\//],
  ['tiles', /\/assets\/world\/[^/]+\/base\/tiles\//],
  ['poses', /\/assets\/world\/[^/]+\/base\/fx\/water\//],
  ['flips', /\/assets\/world\/[^/]+\/base\/fx\/waterfall\//],
  ['clouds', /\/assets\/world\/[^/]+\/base\/fx\/clouds|cloud-shadows\//],
  ['masks', /\/assets\/world\/[^/]+\/base\/masks\//],
  ['canopies', /\.canopy[^/]*\.webp|\.v2hi\.webp/],
  ['village', /\/assets\/world\/[^/]+\/base\/fx\/village\//],
  ['layers', /\/assets\/world\/[^/]+\/base\/layers\//],
  ['worldFx', /\/assets\/world\/[^/]+\/base\/fx\//],
  ['atmosphere', /\/assets\/atmosphere\//],
  ['ui', /\/assets\/ui\//],
  ['js', /\.m?js(?:$|\?)/],
  ['json', /\.json(?:$|\?)/],
  ['media', /\.(css|png|jpe?g|webp|svg|woff2?|ttf|otf)(?:$|\?)/],
];
const CATEGORIES = ['tiles', 'poses', 'canopies', 'flips', 'clouds', 'ui', 'cursors', 'masks', 'village', 'layers', 'worldFx', 'atmosphere', 'json', 'js', 'media', 'other'];

function classify(u) {
  const p = u.split('#')[0];
  for (const [cat, re] of CATEGORY_RULES) if (re.test(p)) return cat;
  return 'other';
}

const fromHar = process.argv.includes('--from-har'); // recompute budget on the saved HAR, no new boot

let interactiveMs = null;
let wallMs = null;
const pageErrors = [];

if (!fromHar) {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordHar: { path: harPath },
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

  while (Date.now() - t0 < TIMEOUT_MS) {
    interactiveMs = await page.evaluate(() => {
      const b = window.__gameBoot;
      return b && b.interactiveMs > 0 ? b.interactiveMs : null;
    });
    if (interactiveMs !== null) break;
    await page.waitForTimeout(POLL_MS);
  }

  // Let stragglers flush into the HAR before closing the context.
  await page.waitForTimeout(3000);
  await context.close();
  await browser.close();
  wallMs = Date.now() - t0;

  if (interactiveMs === null) {
    console.error(`TIMEOUT after ${TIMEOUT_MS / 1000}s — veil never lifted`);
    process.exit(1);
  }
}

const har = JSON.parse(readFileSync(harPath, 'utf8'));
const entries = har.log?.entries ?? [];

const categories = Object.fromEntries(
  CATEGORIES.map((c) => [c, { requests: 0, wireBytes: 0, bodyBytes: 0, maxMs: 0 }]),
);
const otherSamples = [];
let totalWire = 0;
let totalBody = 0;
let maxEntryMs = 0;

for (const e of entries) {
  const u = e.request?.url ?? '';
  const cat = classify(u);
  const transfer = e.response?._transferSize;
  const body = e.response?.bodySize ?? e.response?.content?.size ?? 0;
  const headers = e.response?.headersSize ?? 0;
  const wire = typeof transfer === 'number' && transfer >= 0 ? transfer : Math.max(0, body) + Math.max(0, headers);
  const ms = Math.round(e.time ?? 0);
  const b = categories[cat];
  b.requests += 1;
  b.wireBytes += wire;
  b.bodyBytes += Math.max(0, body);
  if (ms > b.maxMs) b.maxMs = ms;
  if (ms > maxEntryMs) maxEntryMs = ms;
  totalWire += wire;
  totalBody += Math.max(0, body);
  if (cat === 'other' && otherSamples.length < 40) otherSamples.push({ url: u.slice(0, 160), wire });
}

const budget = {
  meta: {
    url,
    capturedAt: new Date().toISOString(),
    interactiveMs,
    wallClockMs: wallMs,
    renderer: 'swiftshader-headless',
    entries: entries.length,
    pageErrors,
  },
  totals: { requests: entries.length, bytes: totalWire, bodyBytes: totalBody, maxRequestMs: maxEntryMs },
  categories,
  unclassified: otherSamples,
};

writeFileSync(path.join(outDir, 'har-budget.json'), JSON.stringify(budget, null, 2));
const mb = (n) => (n / 1048576).toFixed(1);
console.log(`interactiveMs=${interactiveMs} requests=${entries.length} wire=${mb(totalWire)}MB`);
for (const c of CATEGORIES) {
  const b = categories[c];
  if (b.requests) console.log(`  ${c.padEnd(9)} ${String(b.requests).padStart(4)} req  ${mb(b.wireBytes).padStart(7)}MB  max ${(b.maxMs / 1000).toFixed(1)}s`);
}
console.log(`har -> ${harPath}`);
console.log(`budget -> ${path.join(outDir, 'har-budget.json')}`);
