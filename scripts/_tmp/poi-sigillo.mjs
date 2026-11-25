import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'commit', timeout: 150000 });
try { await page.waitForLoadState('domcontentloaded', { timeout: 120000 }); } catch {}
try { await page.waitForSelector('[data-testid="map-quest-poi"]', { timeout: 120000 }); } catch {}
await page.waitForTimeout(2500);
const pt = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="map-quest-poi"]');
  const a = el.closest('[data-poi-zoom]') ?? el;
  const r = a.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, mode: a.getAttribute?.('data-poi-zoom') };
});
console.log('anchor', JSON.stringify(pt));
// far-mode shot first
const s = 300;
await page.screenshot({ path: '.mw/specs/poi-map-icon/card/sigillo-far.png',
  clip: { x: Math.max(0, pt.x - s/2), y: Math.max(0, pt.y - s/2), width: s, height: s } });
// zoom in toward the POI for the near shot
for (let i = 0; i < 10; i++) { await page.mouse.move(pt.x, pt.y); await page.mouse.wheel(0, -600); await page.waitForTimeout(200); }
await page.waitForTimeout(1200);
const pt2 = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="map-quest-poi"]');
  const a = el.closest('[data-poi-zoom]') ?? el;
  const r = a.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, mode: a.getAttribute?.('data-poi-zoom') };
});
console.log('after', JSON.stringify(pt2));
await page.screenshot({ path: '.mw/specs/poi-map-icon/card/sigillo-near.png',
  clip: { x: Math.max(0, pt2.x - s/2), y: Math.max(0, pt2.y - s/2), width: s, height: s } });
await browser.close();
console.log('done');
