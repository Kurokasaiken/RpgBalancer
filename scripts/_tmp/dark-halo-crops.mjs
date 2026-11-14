import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 150000 }); } catch { console.log('cam timeout'); }
await page.waitForTimeout(12000);
const info = await page.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => ({ f: e.getAttribute('data-poi-zanara'), r: e.getBoundingClientRect() })));
console.log(JSON.stringify(info.map(i => ({ f: i.f, x: Math.round(i.r.x), y: Math.round(i.r.y) }))));
let j = 0, q = 0;
for (const m of info) {
  const cx = m.r.x + m.r.width / 2, cy = m.r.y + m.r.height / 2;
  const name = `test-results/poi-zanara-live/dark-${m.f === 'job' ? 'j' + (j++) : 'q' + (q++)}.png`;
  await page.screenshot({ path: name, clip: { x: Math.max(0, cx - 110), y: Math.max(0, cy - 110), width: 220, height: 220 }, timeout: 120000 });
  console.log('saved', name);
}
await page.screenshot({ path: 'test-results/poi-zanara-live/dark-full.png', timeout: 120000 });
await browser.close();
