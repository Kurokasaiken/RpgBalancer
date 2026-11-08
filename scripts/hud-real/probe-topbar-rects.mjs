// PLAN-112 F4 witness: contract rects of the top row on /hud-compose + headless captures.
// Usage: node scripts/hud-real/probe-topbar-rects.mjs [--url http://localhost:5173]
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.argv.includes('--url') ? process.argv[process.argv.indexOf('--url') + 1] : 'http://localhost:5173';
const OUT = 'test-results/plan112-f4-topbar';
fs.mkdirSync(OUT, { recursive: true });
const M = 24, TW = 420, RW = 360, TH = 56, PITCH = 80;
// contract amended G1 #4 (PLAN-112 §29-30): crest 156 at (24,24), roster 268 under it (dy 158), ribbon-with-plaques footprint
const errors = [];
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

for (const [w, h] of [[1280, 800], [1440, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const perr = [];
  page.on('pageerror', (e) => perr.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') perr.push(m.text()); });
  await page.goto(`${BASE}/hud-compose`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('[data-hudslot="roster"]', { timeout: 15000 });
  const rects = await page.evaluate(() => {
    const out = {};
    for (const el of document.querySelectorAll('[data-hudslot]')) {
      const r = el.getBoundingClientRect();
      out[el.dataset.hudslot] = { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    return out;
  });
  // contract rects at zoom 1 (canvas = window): roster 24,24,88x(432 or resolved), time (W-420)/2,24,420,56, resources W-24-360,24,360,56
  const exp = {
    crest: { x: M, y: M, w: 156, h: 156 },
    roster: { x: M, y: M + 156 - 22, w: 268 },
    time: { x: (w - TW) / 2, y: M, w: TW, h: TH },
    resources: { x: w - M - RW, y: M, w: RW, h: TH },
    panel: { x: w - M - 340, y: M + TH + 16, w: 340 },
    nav: { x: (w - 460) / 2, w: 460 },
    commands: { x: w - M - 132, y: h - M - 40, w: 132, h: 40 },
  };
  const lines = [`== ${w}x${h} dpr2 ==`];
  for (const id of ['crest', 'roster', 'time', 'resources', 'nav', 'commands']) {
    const a = rects[id], e = exp[id];
    if (!a) { errors.push(`${w}x${h}: missing [data-hudslot=${id}]`); continue; }
    for (const k of Object.keys(e)) {
      const d = Math.abs(a[k] - e[k]);
      if (d > 2) errors.push(`${w}x${h} ${id}.${k}: got ${a[k].toFixed(1)} expected ${e[k]} (d=${d.toFixed(1)})`);
    }
    lines.push(` ${id}: ${JSON.stringify(a)}`);
  }
  // same top edge: crest.y == time.y == resources.y (the roster starts below the crest since amend G1 #4)
  if (Math.abs(rects.crest.y - rects.time.y) > 2 || Math.abs(rects.time.y - rects.resources.y) > 2)
    errors.push(`${w}x${h}: top edge not on one line (crest.y=${rects.crest.y}, time.y=${rects.time.y}, resources.y=${rects.resources.y})`);
  // ribbon row pitch check: zanara pitch 62 x 1.25 = 77.5 (C1 ribbon, amend G1 #4)
  const rowH = await page.evaluate(() => {
    const rows = document.querySelectorAll('[data-hudreal-rosterribbon] [data-hr-ribbon-row]');
    return rows.length > 1 ? rows[1].getBoundingClientRect().y - rows[0].getBoundingClientRect().y : 0;
  });
  if (rowH && Math.abs(rowH - 77.5) > 1.5) errors.push(`${w}x${h}: ribbon row pitch ${rowH.toFixed(1)} != 77.5`);
  lines.push(` pitch=${rowH.toFixed(1)}`);
  if (perr.length) errors.push(`${w}x${h}: page errors: ${perr.join(' | ')}`);
  console.log(lines.join('\n'));
  await page.screenshot({ path: `${OUT}/compose-${w}x${h}-dpr2.png` });
  await page.goto(`${BASE}/hud-compose?view=context`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const pr = await page.evaluate(() => { const r = document.querySelector('[data-hudslot="panel"]')?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; });
  if (!pr) errors.push(`${w}x${h}: panel missing in context view`);
  else if (Math.abs(pr.x - exp.panel.x) > 2 || Math.abs(pr.w - exp.panel.w) > 2) errors.push(`${w}x${h} panel: got ${JSON.stringify(pr)}`);
  await page.screenshot({ path: `${OUT}/compose-${w}x${h}-context-dpr2.png` });
  await page.close();
}
await browser.close();
if (errors.length) { console.log('FAIL\n' + errors.join('\n')); process.exit(1); }
console.log('PASS: top-row contract rects hold on both windows, no page errors');
