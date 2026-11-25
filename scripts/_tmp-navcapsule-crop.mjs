import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/game?navskin=capsule', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 60; i++) {
  let ok = false;
  try { ok = await p.evaluate(() => !!document.querySelector('canvas') && !document.querySelector('[data-boot-phase]')); } catch {}
  if (ok) break;
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(1200);
const box = await p.locator('[data-hudreal-nav] > div').boundingBox();
console.log('capsule box', JSON.stringify(box));
await p.screenshot({ path: 'test-results/nav-capsule-crop.png', clip: { x: box.x - 50, y: box.y - 30, width: box.width + 100, height: box.height + 80 } });
await b.close();
