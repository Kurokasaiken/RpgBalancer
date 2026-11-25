import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(6000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 45000 }); } catch {}
const list = await page.evaluate(() => [...document.querySelectorAll('[data-poi-zoom]')].map(a => {
  const r = a.getBoundingClientRect();
  return { mode: a.getAttribute('data-poi-zoom'), w: Math.round(r.width), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2),
    real: !!a.querySelector('[data-testid="map-quest-poi"]') };
}));
console.log('anchors', JSON.stringify(list));
// pick a real quest POI (largest if several), else any
const target = list.find(a => a.real) ?? list[0];
if (!target) { console.log('NO_ANCHOR'); await page.screenshot({ path: '.mw/specs/poi-map-icon/card/baptized-nopo.png' }); await browser.close(); process.exit(0); }
// zoom toward it: move mouse over the anchor and wheel in several times
for (let i = 0; i < 10; i++) { await page.mouse.move(target.x, target.y); await page.mouse.wheel(0, -600); await page.waitForTimeout(200); }
await page.waitForTimeout(1200);
const after = await page.evaluate((ti) => {
  const anchors = [...document.querySelectorAll('[data-poi-zoom]')];
  const a = anchors[ti] ?? anchors.find(x => x.querySelector('[data-testid="map-quest-poi"]'));
  if (!a) return null;
  const r = a.getBoundingClientRect();
  return { mode: a.getAttribute('data-poi-zoom'), x: r.x + r.width/2, y: r.y + r.height/2, w: r.width };
}, list.indexOf(target));
console.log('after', JSON.stringify(after));
if (after) {
  const cw = 340, ch = 340;
  await page.screenshot({ path: '.mw/specs/poi-map-icon/card/baptized-near.png',
    clip: { x: Math.max(0, after.x - cw/2), y: Math.max(0, after.y - ch/2), width: cw, height: ch } });
}
await browser.close();
console.log('done');
