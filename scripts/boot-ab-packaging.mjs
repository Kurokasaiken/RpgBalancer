#!/usr/bin/env node
// PLAN-126 T-A3 (0.3): controlled A/B request-overhead experiment.
// Same payload bytes, equivalent parallelism — current per-file fan-out vs
// category bundles. Packaging is adopted ONLY at a reproducible ≥2s win.
//
// Method: a local server serves (a) the real public/ tree, and (b) synthetic
// category bundles = concatenated bytes of each category's files. A headless
// page fetches the boot URL list (extracted from har-budget.json) in both
// modes — individual URLs vs ~10 bundle endpoints — N runs each, alternating,
// no-store. Bytes fetched are equal by construction; differences are request
// overhead + parse scheduling only.
//
// Usage: node scripts/boot-ab-packaging.mjs [harBudgetJson] [--runs 5] [--out path]

import { chromium } from 'playwright';
import http from 'node:http';
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const budgetPath = process.argv[2] ?? '.mw/runs/plan126-boot-bytes/har-budget.json';
const runs = Number(process.argv.find((a) => a.startsWith('--runs='))?.split('=')[1] ?? 5);
const outPath = process.argv.find((a) => a.startsWith('--out='))?.split('=')[1] ?? '.mw/runs/plan126-boot-bytes/ab-packaging.json';
const PUBLIC = path.resolve('public');

// Same classifier as boot-byte-budget.mjs
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
];
function classify(u) {
  const p = u.split('#')[0].split('?')[0];
  for (const [c, re] of CATEGORY_RULES) if (re.test(p)) return c;
  return null;
}

// Build the file list from the HAR-derived budget: only local public/ assets
// (bundled app chunks/media are out of scope — packaging targets the world/ui set).
const har = JSON.parse(readFileSync(path.join(path.dirname(budgetPath), 'boot.har'), 'utf8'));
const filesByCat = new Map();
for (const e of har.log.entries) {
  const u = e.request.url;
  const cat = classify(u);
  if (!cat) continue;
  const rel = decodeURIComponent(new URL(u).pathname).replace(/^\//, '');
  const fp = path.join(PUBLIC, rel);
  try {
    statSync(fp);
  } catch {
    continue;
  }
  if (!filesByCat.has(cat)) filesByCat.set(cat, []);
  filesByCat.get(cat).push({ url: '/' + rel, path: fp });
}
const allFiles = [...filesByCat.values()].flat();
const bundles = [...filesByCat.entries()].map(([cat, files]) => ({
  cat,
  body: Buffer.concat(files.map((f) => readFileSync(f.path))),
  files: files.length,
}));
const totalBytes = allFiles.reduce((s, f) => s + statSync(f.path).size, 0);
const bundleBytes = bundles.reduce((s, b) => s + b.body.length, 0);
if (totalBytes !== bundleBytes) throw new Error(`byte mismatch ${totalBytes} != ${bundleBytes}`);

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  res.setHeader('cache-control', 'no-store');
  if (u.startsWith('/bundle/')) {
    const cat = u.slice('/bundle/'.length);
    const b = bundles.find((x) => x.cat === cat);
    if (!b) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-length': b.body.length, 'content-type': 'application/octet-stream' });
    res.end(b.body);
    return;
  }
  const fp = path.join(PUBLIC, u.replace(/^\//, ''));
  try {
    const data = readFileSync(fp);
    res.writeHead(200, { 'content-length': data.length, 'content-type': 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log(`files=${allFiles.length} bytes=${(totalBytes / 1048576).toFixed(1)}MB bundles=${bundles.length} port=${port}`);

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/bundle/`, { waitUntil: 'domcontentloaded' }).catch(() => {});

const fileUrls = JSON.stringify(allFiles.map((f) => f.url));
const bundleUrls = JSON.stringify(bundles.map((b) => `/bundle/${b.cat}`));

async function measure(urlsJson) {
  return page.evaluate(async (urls) => {
    const t0 = performance.now();
    const r = await Promise.all(urls.map((u) => fetch(u, { cache: 'no-store' }).then((x) => x.arrayBuffer())));
    const lastByte = performance.now() - t0;
    return { lastByte, bytes: r.reduce((s, b) => s + b.byteLength, 0) };
  }, JSON.parse(urlsJson));
}

const results = { A: [], B: [] };
for (let i = 0; i < runs; i++) {
  const a = await measure(fileUrls);
  results.A.push(a.lastByte);
  const b = await measure(bundleUrls);
  results.B.push(b.lastByte);
  console.log(`run ${i + 1}: fanout=${a.lastByte.toFixed(0)}ms (${(a.bytes / 1048576).toFixed(1)}MB)  bundles=${b.lastByte.toFixed(0)}ms (${(b.bytes / 1048576).toFixed(1)}MB)`);
}
await browser.close();
server.close();

const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const report = {
  meta: { capturedAt: new Date().toISOString(), files: allFiles.length, bundles: bundles.length, bytes: totalBytes, runs },
  fanoutMs: results.A.map(Math.round),
  bundlesMs: results.B.map(Math.round),
  medianFanoutMs: Math.round(med(results.A)),
  medianBundlesMs: Math.round(med(results.B)),
  deltaMs: Math.round(med(results.A) - med(results.B)),
  verdict: med(results.A) - med(results.B) >= 2000 ? 'PACKAGING-WINS (>=2s)' : 'no-adopt (<2s gain)',
};
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`median: fanout=${report.medianFanoutMs}ms bundles=${report.medianBundlesMs}ms delta=${report.deltaMs}ms -> ${report.verdict}`);
console.log(`-> ${outPath}`);
