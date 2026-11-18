// Focused verification probe for R-359 fixes (local preview).
//  B-A: drag a NON-first resident -> overlay must show ITS portrait
//  assign x2 -> real swap A<->B
//  B-D: drag token out -> slot-token-ghost visible during drag-out
//  B-E: after extract, resident back in roster with portrait img
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const url = process.env.PROBE_URL || 'https://rpg-balancer.vercel.app/game';
const OUT = '.mw/bugs/20261118-medallion-drag/evidence';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (p, n) => p.screenshot({ path: path.join(OUT, `v2-${n}.png`) });

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
let interactiveMs = null;
while (Date.now() - t0 < 120000) {
  interactiveMs = await page.evaluate(() => window.__gameBoot?.interactiveMs > 0 ? window.__gameBoot.interactiveMs : null);
  if (interactiveMs !== null) break;
  await sleep(2000);
}
if (!interactiveMs) { console.error('TIMEOUT'); process.exit(1); }
await sleep(2000);
const report = { interactiveMs };

await page.keyboard.press('r');
await sleep(1200);
const pois = page.locator('[data-testid="map-quest-poi"]');
for (let i = 0; i < await pois.count(); i++) {
  await pois.nth(i).click({ force: true });
  await sleep(1500);
  if ((await page.locator('[data-slot-id]').count()) > 0) break;
}
const boxes = (sel, key) => page.evaluate((s) =>
  [...document.querySelectorAll(s)].map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.getAttribute('data-resident-id') ?? el.getAttribute('data-slot-id') ?? el.getAttribute('data-testid'), x: r.x, y: r.y, w: r.width, h: r.height };
  }).filter((b) => b.w > 0), sel);
const slotState = () => page.evaluate(() =>
  [...document.querySelectorAll('[data-slot-id]')].map((el) => {
    const token = el.querySelector('[data-testid^="slot-token-"]');
    return { slot: el.getAttribute('data-slot-id'), occupant: token?.getAttribute('aria-label') ?? null };
  }));
const rosterState = () => page.evaluate(() =>
  [...document.querySelectorAll('[data-resident-id]')].map((el) => {
    const img = el.querySelector('img');
    return { id: el.getAttribute('data-resident-id'), img: img?.src.split('/').pop() ?? null, complete: img?.complete ?? null, nw: img?.naturalWidth ?? null };
  }));

async function dragTo(box, tx, ty, holdMs = 260) {
  const sx = box.x + box.w / 2, sy = box.y + box.h / 2;
  await page.mouse.move(sx, sy); await page.mouse.down(); await sleep(holdMs);
  await page.mouse.move(sx + 30, sy + 15, { steps: 4 }); await sleep(60);
  await page.mouse.move(tx, ty, { steps: 8 }); await sleep(60); await page.mouse.up();
}

// ---- B-A definitive: drag the LAST card (not residentsById[0]) ----
let cards = await boxes('[data-resident-id]');
report.cards = cards.map(c => c.id);
const last = cards[cards.length - 1];
await page.mouse.move(last.x + last.w / 2, last.y + last.h / 2);
await page.mouse.down();
await sleep(300);
await page.mouse.move(last.x + 60, last.y + 30, { steps: 4 });
// sample warm node EARLY (before real overlay commits) + real overlay
for (const delay of [80, 220]) {
  await sleep(delay);
  const probe = await page.evaluate(() => {
    const warm = document.querySelector('[data-drag-warm-mount]');
    const warmImgs = warm ? [...warm.querySelectorAll('img')].map(i => i.src.split('/').pop()) : [];
    const overlay = document.querySelector('[data-dnd-overlay]');
    const overlayImgs = overlay ? [...overlay.querySelectorAll('img')].map(i => i.src.split('/').pop()) : [];
    return { warmVis: warm ? getComputedStyle(warm).visibility : null, warmImgs, overlayImgs, warmDebug: warm?.getAttribute('data-debug-active-id') };
  });
  (report.ba ??= []).push(probe);
}
await shot(page, 'ba-drag');
await page.mouse.up();
await sleep(800);

// ---- assign two residents ----
const slots = await boxes('[data-slot-id]');
report.slots = slots.map(s => s.id);
for (let i = 0; i < 2; i++) {
  cards = await boxes('[data-resident-id]');
  if (!cards[i]) break;
  console.log('assign', cards[i].id, '->', slots[i].id);
  await dragTo(cards[i], slots[i].x + slots[i].w / 2, slots[i].y + slots[i].h / 2);
  await sleep(1600);
  report[`assign${i}`] = await slotState();
}

// ---- real swap: token of slot0 -> occupied slot1 ----
let tokens = await boxes('[data-testid^="slot-token-"]');
report.tokens = tokens.map(t => t.id);
if (tokens.length >= 2) {
  await dragTo(tokens[0], slots[1].x + slots[1].w / 2, slots[1].y + slots[1].h / 2, 300);
  await sleep(1600);
  report.afterSwap = await slotState();
  await shot(page, 'swap');
}

// ---- B-D: drag token out to roster area -> ghost during drag ----
tokens = await boxes('[data-testid^="slot-token-"]');
if (tokens.length) {
  const tok = tokens[0];
  await page.mouse.move(tok.x + tok.w / 2, tok.y + tok.h / 2);
  await page.mouse.down();
  await sleep(300);
  await page.mouse.move(tok.x - 200, tok.y, { steps: 5 });
  await sleep(120);
  report.bd = await page.evaluate(() => ({
    ghost: !!document.querySelector('[data-testid="slot-token-ghost"]'),
    ghostImgs: [...document.querySelectorAll('[data-testid="slot-token-ghost"] img')].map(i => i.src.split('/').pop()),
    overlayImgs: [...document.querySelectorAll('[data-dnd-overlay] img')].map(i => i.src.split('/').pop()),
  }));
  await shot(page, 'bd-dragout');
  await page.mouse.move(300, 300, { steps: 6 });
  await sleep(200);
  await page.mouse.up();
  // sample flight over 1.5s
  const flights = [];
  for (let i = 0; i < 10; i++) {
    await sleep(150);
    const n = await page.evaluate(() => document.querySelectorAll('[data-flight-proxy],[data-testid*="flight"],[data-flight]').length);
    if (n) flights.push({ t: i * 150, n });
  }
  report.bd.flights = flights;
  await sleep(1200);
  report.bd.afterExtract = await slotState();
  report.bd.roster = await rosterState();
  await shot(page, 'bd-after');
}

report.final = { slots: await slotState(), roster: await rosterState() };
writeFileSync(path.join(OUT, 'dnd-verify.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
