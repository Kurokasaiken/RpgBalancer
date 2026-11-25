import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 60; i++) {
  let ok = false;
  try { ok = await p.evaluate(() => !!document.querySelector('canvas') && !document.querySelector('[data-boot-phase]')); } catch {}
  if (ok) break;
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(1200);
const src = await p.evaluate(() => document.querySelector('[data-hudreal-nav] img')?.getAttribute('src'));
console.log('nav img src:', src);
await p.screenshot({ path: 'test-results/nav-dark-default-full.png' });
const box = await p.locator('[data-hudreal-nav] > img').boundingBox();
await p.screenshot({ path: 'test-results/nav-dark-default-crop.png', clip: { x: box.x - 50, y: box.y - 30, width: box.width + 100, height: box.height + 80 } });
console.log('done');
await b.close();
