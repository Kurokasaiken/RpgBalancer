// Focused: hold-extract an assigned resident -> does the return flight render + settle?
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const url = process.env.PROBE_URL || 'https://rpg-balancer.vercel.app/game';
const OUT = '.mw/bugs/20261118-medallion-drag/evidence';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('console', (m) => { if (m.text().includes('R359-DEBUG')) console.log('CONSOLE>', m.text()); });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
let im = null;
while (Date.now() - t0 < 120000) {
  im = await page.evaluate(() => window.__gameBoot?.interactiveMs > 0 ? window.__gameBoot.interactiveMs : null);
  if (im !== null) break;
  await sleep(2000);
}
if (!im) { console.error('TIMEOUT'); process.exit(1); }
await sleep(2000);
await page.keyboard.press('r');
await sleep(1200);
const pois = page.locator('[data-testid="map-quest-poi"]');
for (let i = 0; i < await pois.count(); i++) {
  await pois.nth(i).click({ force: true }); await sleep(1500);
  if ((await page.locator('[data-slot-id]').count()) > 0) break;
}
const card = await page.evaluate(() => {
  const el = [...document.querySelectorAll('[data-resident-id]')].find(e => e.getBoundingClientRect().width > 0);
  const r = el.getBoundingClientRect();
  return { id: el.getAttribute('data-resident-id'), x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
const slot = await page.evaluate(() => {
  const el = document.querySelector('[data-slot-id]');
  const r = el.getBoundingClientRect();
  return { id: el.getAttribute('data-slot-id'), x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
console.log('assign', card.id, '->', slot.id);
await page.mouse.move(card.x, card.y); await page.mouse.down(); await sleep(260);
await page.mouse.move(card.x + 30, card.y + 15, { steps: 4 }); await sleep(60);
await page.mouse.move(slot.x, slot.y, { steps: 8 }); await sleep(60); await page.mouse.up();
await sleep(2000);
const tok = await page.evaluate(() => {
  const el = document.querySelector('[data-testid^="slot-token-"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { testid: el.getAttribute('data-testid'), x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
console.log('token:', JSON.stringify(tok));
const samples = [];
const snap = (label) => page.evaluate((l) => {
  const slot = document.querySelector('[data-slot-id]');
  const tok = document.querySelector('[data-testid^="slot-token-"]');
  const flightEls = [...document.querySelectorAll('*')].filter(e =>
    (e.getAttribute('data-testid') || '').includes('flight') ||
    (e.getAttribute('data-flight-proxy') !== null) ||
    (e.className && String(e.className).includes('light')));
  const proxyImg = flightEls.map(e => [...e.querySelectorAll('img')].map(i => i.src.split('/').pop())).flat();
  const medal = slot?.querySelector('[data-testid^="slot-medal-"]');
  return { t: l, token: !!tok, medalOp: medal ? getComputedStyle(medal).opacity : null,
           flightCount: flightEls.length, proxyImgs: proxyImg.slice(0, 3),
           overlayImgs: [...document.querySelectorAll('[data-dnd-overlay] img')].map(i => i.src.split('/').pop()) };
}, label);
samples.push(await snap('pre-hold'));
// press & hold extract
await page.mouse.move(tok.x, tok.y); await page.mouse.down();
for (let i = 1; i <= 8; i++) { await sleep(150); samples.push(await snap(`hold+${i * 150}`)); }
await page.mouse.up();
for (let i = 1; i <= 16; i++) { await sleep(150); samples.push(await snap(`post+${i * 150}`)); }
const roster = await page.evaluate(() =>
  [...document.querySelectorAll('[data-resident-id]')].map(el => {
    const img = el.querySelector('img');
    return { id: el.getAttribute('data-resident-id'), imgOk: img?.complete && img.naturalWidth > 0, vis: getComputedStyle(el).opacity };
  }));
await page.screenshot({ path: path.join(OUT, 'v3-extract-end.png') });
const report = { interactiveMs: im, tok, samples, roster };
writeFileSync(path.join(OUT, 'extract-flight.json'), JSON.stringify(report, null, 2));
// compact print: only transitions
let last = '';
for (const s of samples) {
  const sig = `token:${s.token} op:${s.medalOp} flights:${s.flightCount} pxImgs:${s.proxyImgs.join(',')} ovImgs:${s.overlayImgs.join(',')}`;
  if (sig !== last) { console.log(s.t, '=>', sig); last = sig; }
}
console.log('roster:', JSON.stringify(roster));
await browser.close();
