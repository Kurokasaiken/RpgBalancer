import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 150000 }); } catch { console.log('cam timeout'); }
await page.waitForTimeout(3000);
const info = await page.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => ({ f: e.getAttribute('data-poi-zanara'), r: e.getBoundingClientRect() })));
console.log(JSON.stringify(info.map(i => ({ f: i.f, x: Math.round(i.r.x), y: Math.round(i.r.y) }))));
const q = info.find(e => e.f === 'quest');
if (q) {
  const cx = q.r.x + q.r.width / 2, cy = q.r.y + q.r.height / 2;
  await page.screenshot({ path: 'test-results/poi-zanara-live/colors-quest-crop.png', clip: { x: Math.max(0, cx - 110), y: Math.max(0, cy - 110), width: 220, height: 220 }, timeout: 120000 });
  console.log('quest crop saved');
}
await browser.close();
