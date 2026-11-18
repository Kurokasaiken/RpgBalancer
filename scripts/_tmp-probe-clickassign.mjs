import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const OUT = '.mw/bugs/20261118-medallion-drag/evidence';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:4173/game', { waitUntil: 'domcontentloaded' });
const t0 = Date.now();
while (Date.now() - t0 < 120000) {
  const im = await page.evaluate(() => window.__gameBoot?.interactiveMs > 0 ? window.__gameBoot.interactiveMs : null);
  if (im) break; await sleep(2000);
}
await sleep(2000);
await page.keyboard.press('r'); await sleep(1200);
const pois = page.locator('[data-testid="map-quest-poi"]');
for (let i = 0; i < await pois.count(); i++) { await pois.nth(i).click({ force: true }); await sleep(1500); if ((await page.locator('[data-slot-id]').count()) > 0) break; }
// click a roster card -> measure click -> flight-proxy -> seat fill
const card = await page.evaluate(() => {
  const el = [...document.querySelectorAll('[data-resident-id]')].find(e => e.getBoundingClientRect().width > 0);
  const r = el.getBoundingClientRect();
  return { id: el.getAttribute('data-resident-id'), x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
const results = [];
const tc = Date.now();
await page.mouse.click(card.x, card.y);
let sawFlight = null, seatFilled = null;
for (let i = 0; i < 40; i++) {
  await sleep(100);
  const fp = await page.evaluate(() => document.querySelectorAll('[data-testid="flight-proxy"]').length);
  const occ = await page.evaluate(() => !!document.querySelector('[data-testid^="slot-token-"]'));
  if (fp > 0 && sawFlight === null) sawFlight = Date.now() - tc;
  if (occ && seatFilled === null) { seatFilled = Date.now() - tc; break; }
}
const second = await page.evaluate(() => {
  const el = [...document.querySelectorAll('[data-resident-id]')].filter(e => e.getBoundingClientRect().width > 0)[1];
  const r = el.getBoundingClientRect();
  return { id: el.getAttribute('data-resident-id'), x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
const t2 = Date.now();
await page.mouse.click(second.x, second.y);
let saw2 = null, occ2 = null;
for (let i = 0; i < 40; i++) {
  await sleep(100);
  const fp = await page.evaluate(() => document.querySelectorAll('[data-testid="flight-proxy"]').length);
  const occ = await page.evaluate(() => document.querySelectorAll('[data-testid^="slot-token-"]').length);
  if (fp > 0 && saw2 === null) saw2 = Date.now() - t2;
  if (occ >= 2) { occ2 = { n: occ, t: Date.now() - t2 }; break; }
}
await page.screenshot({ path: path.join(OUT, 'v4-clickassign.png') });
console.log(JSON.stringify({ card: card.id, sawFlight, seatFilled, second: second.id, saw2, occ2 }));
await browser.close();
