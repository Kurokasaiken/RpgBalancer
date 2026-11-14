import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
try {
  await page.waitForFunction(() => window.__worldCam, null, { timeout: 150000 });
} catch (e) { console.log('cam timeout'); }
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-poi-zanara]')];
  return els.map(e => ({ family: e.getAttribute('data-poi-zanara'), rect: e.getBoundingClientRect(), visible: e.offsetParent !== null }));
});
console.log(JSON.stringify(info));
await browser.close();
