import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(4000);
try { await page.waitForSelector('[data-poi-zoom]', { timeout: 30000 }); } catch {}
const b = await page.evaluate(() => {
  const a = [...document.querySelectorAll('[data-poi-zoom]')].find(x => x.querySelector('[data-poi-zanara="quest"]'));
  const r = a.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2 };
});
await page.screenshot({ path: '/tmp/quest-fixed.png', clip: { x: b.x-130, y: b.y-130, width: 260, height: 260 } });
await page.screenshot({ path: '/tmp/fixed-full.png' });
await browser.close();
console.log('ok');
