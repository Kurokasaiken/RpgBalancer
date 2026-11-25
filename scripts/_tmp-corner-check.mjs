import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForSelector('[data-hud-corner]', { timeout: 120000 });
await page.waitForTimeout(600);
const r = await page.evaluate(() => {
  const el = document.querySelector('[data-hud-corner]');
  const b = el.getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height, transform: getComputedStyle(el).transform };
});
console.log(JSON.stringify(r));
await page.screenshot({ path: '.mw/runs/20261124-hud-critique-multi-ai/witness-corner-scaled.jpg', type: 'jpeg', quality: 85 });
await page.close(); process.exit(0);
