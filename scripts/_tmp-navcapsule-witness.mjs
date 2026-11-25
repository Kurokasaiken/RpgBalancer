import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
for (const [tag, url] of [['capsule', 'http://localhost:5173/game?navskin=capsule'], ['green', 'http://localhost:5173/game?navskin=green']]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
  p.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 200)); });
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  for (let i = 0; i < 60; i++) {
    let ok = false;
    try { ok = await p.evaluate(() => !!document.querySelector('canvas') && !document.querySelector('[data-boot-phase]')); } catch {}
    if (ok) break;
    await p.waitForTimeout(2000);
  }
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `test-results/nav-${tag}-full.png` });
  const nav = await p.locator('[data-hudreal-nav]');
  const box = await nav.boundingBox();
  if (box) {
    await p.screenshot({ path: `test-results/nav-${tag}-crop.png`, clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 20), width: box.width + 80, height: box.height + 60 } });
  }
  console.log(tag, 'done');
  await p.close();
}
await b.close();
