import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
for (const [tag, url] of [['before', 'http://localhost:5173/game'], ['after', 'http://localhost:5173/game?navskin=green']]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  for (let i = 0; i < 60; i++) {
    let ok = false;
    try { ok = await p.evaluate(() => !!document.querySelector('canvas') && !document.querySelector('[data-boot-phase]')); } catch {}
    if (ok) break;
    await p.waitForTimeout(2000);
  }
  await p.waitForTimeout(1200);
  const nav = await p.locator('[data-hudreal-nav]');
  await p.screenshot({ path: `test-results/nav-green-${tag}-full.png` });
  const box = await nav.boundingBox();
  if (box) {
    await p.screenshot({ path: `test-results/nav-green-${tag}-crop.png`, clip: { x: box.x - 40, y: box.y - 20, width: box.width + 80, height: box.height + 60 } });
  }
  const src = await p.evaluate(() => document.querySelector('[data-hudreal-nav] img')?.getAttribute('src'));
  console.log(tag, 'img src:', src);
  await p.close();
}
await b.close();
