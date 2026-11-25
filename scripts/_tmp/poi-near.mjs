import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(4000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 30000 }); } catch {}
// wheel-zoom in on the quest poi position
for (let i = 0; i < 8; i++) {
  await page.mouse.move(1066, 353);
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(200);
}
const after = await page.evaluate(() => {
  const cam = window.__worldCam;
  const a = [...document.querySelectorAll('[data-poi-zoom]')].find(x => x.querySelector('[data-poi-zanara="quest"]'));
  const r = a.getBoundingClientRect();
  return { mode: a.getAttribute('data-poi-zoom'), x: r.x + r.width/2, y: r.y + r.height/2, zoom: cam?.zoom, w: r.width };
});
console.log('AFTER', JSON.stringify(after));
const s = Math.max(60, after.w * 0.85);
await page.screenshot({ path: '/tmp/swap-near-quest.png', clip: { x: Math.max(0,after.x-s), y: Math.max(0,after.y-s), width: Math.min(1600-after.x+s, s*2), height: Math.min(1000-after.y+s, s*2) } });
await browser.close();
console.log('done');
