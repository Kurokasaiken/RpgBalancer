import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForTimeout(1200);
const rect = await page.evaluate(() => {
  const el = document.querySelector('[data-hud-corner]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const before = getComputedStyle(el, '::before');
  return { x: r.x, y: r.y, w: r.width, h: r.height, filter: cs.filter, beforeBg: before.backgroundImage.slice(0,80), beforeRadius: before.borderRadius };
});
console.log('corner:', JSON.stringify(rect));
const pad = 14;
if (rect) {
  await page.screenshot({ path: '.mw/runs/20261124-hud-critique-multi-ai/witness-corner-final.png',
    clip: { x: Math.max(0, rect.x - pad), y: Math.max(0, rect.y - pad), width: rect.w + pad*2, height: rect.h + pad*2 } });
}
await page.screenshot({ path: '.mw/runs/20261124-hud-critique-multi-ai/witness-full-final.jpg', type: 'jpeg', quality: 80 });
await page.close();
process.exit(0);
