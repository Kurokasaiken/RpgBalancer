import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('[data-hr-time="phase"]', { timeout: 30000 });
await page.waitForTimeout(4500);
await page.evaluate(() => {
  const ph = document.querySelector('[data-hr-time="phase"]');
  const imgs = ph.querySelectorAll('img');
  imgs[0].style.opacity = '0';           // sun off
  imgs[1].style.opacity = '1';           // moon on
  const circles = document.querySelectorAll('[data-hudreal-time] svg circle');
  if (circles[1]) circles[1].style.opacity = '1';  // nightWash on
});
await page.waitForTimeout(300);
const el = await page.$('[data-hr-time="phase"]');
const box = await el.boundingBox();
await page.screenshot({ path: '/tmp/med-night.png', clip: { x: box.x - 60, y: box.y - 60, width: box.width + 260, height: box.height + 120 } });
await b.close();
console.log('done');
