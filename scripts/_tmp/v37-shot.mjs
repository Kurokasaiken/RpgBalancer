import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'commit', timeout: 150000 });
try { await p.waitForLoadState('domcontentloaded', { timeout: 120000 }); } catch {}
try { await p.waitForSelector('[data-poi-zoom] .poiv3_7', { timeout: 150000 }); } catch {}
await p.waitForTimeout(8000);
const locate = () => p.evaluate(() => {
  const el = document.querySelector('[data-poi-zoom] .poiv3_7');
  const a = el.closest('[data-poi-zoom]');
  const r = a.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, mode: a.getAttribute('data-poi-zoom') };
});
const pt = await locate();
console.log('anchor', JSON.stringify(pt));
const s = 320;
await p.screenshot({ path: '.mw/specs/poi-map-icon/card/v37-far.png',
  clip: { x: Math.max(0, pt.x - s / 2), y: Math.max(0, pt.y - s / 2), width: s, height: s } });
for (let i = 0; i < 10; i++) { await p.mouse.move(pt.x, pt.y); await p.mouse.wheel(0, -600); await p.waitForTimeout(200); }
await p.waitForTimeout(1200);
const pt2 = await locate();
console.log('after', JSON.stringify(pt2));
const x = Math.min(Math.max(0, pt2.x - s / 2), 1600 - s);
const y = Math.min(Math.max(0, pt2.y - s / 2), 1000 - s);
await p.screenshot({ path: '.mw/specs/poi-map-icon/card/v37-near.png', clip: { x, y, width: s, height: s } });
await b.close();
console.log('done');
