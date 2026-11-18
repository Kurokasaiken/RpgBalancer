import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:4173/game', { waitUntil: 'domcontentloaded' });
const t0 = Date.now();
while (Date.now() - t0 < 120000) {
  const im = await p.evaluate(() => window.__gameBoot?.interactiveMs > 0 ? window.__gameBoot.interactiveMs : null);
  if (im) break; await new Promise(r => setTimeout(r, 2000));
}
await new Promise(r => setTimeout(r, 2000));
await p.keyboard.press('r'); await new Promise(r => setTimeout(r, 1200));
const pois = p.locator('[data-testid="map-quest-poi"]');
for (let i = 0; i < await pois.count(); i++) { await pois.nth(i).click({ force: true }); await new Promise(r => setTimeout(r, 1500)); if ((await p.locator('[data-slot-id]').count()) > 0) break; }
const res = await p.evaluate(() => ({
  slotButtons: [...document.querySelectorAll('[data-testid^="slot-button-"]')].map(e => ({ id: e.getAttribute('data-testid'), w: e.getBoundingClientRect().width })),
  slotIds: [...document.querySelectorAll('[data-slot-id]')].map(e => e.getAttribute('data-slot-id')),
  slotTokens: [...document.querySelectorAll('[data-testid^="slot-token-"]')].map(e => e.getAttribute('data-testid')),
  residentCards: document.querySelectorAll('[data-resident-id]').length,
  residentCount: !!document.querySelector('[data-resident-count]'),
  dragTestContainer: !!document.querySelector('[data-testid="drag-test-container"]'),
}));
console.log(JSON.stringify(res, null, 1));
await b.close();
