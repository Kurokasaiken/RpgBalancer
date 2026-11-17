import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 300000, polling: 1000 }).catch(() => {});
for (let i = 0; i < 40; i++) {
  if (await p.evaluate(() => document.querySelector('[data-testid="game-top-chrome"]') !== null)) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('[data-testid="game-boot-screen"]')?.remove());
await p.waitForTimeout(500);
const m = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="chrome-res-cap-mirror"]');
  const r = el.getBoundingClientRect().toJSON();
  const img = el.querySelector('img');
  const ir = img.getBoundingClientRect().toJSON();
  return { clip: r, img: { l: +ir.x.toFixed(1), w: +ir.width.toFixed(1) }, vis: getComputedStyle(el).zIndex };
});
console.log(JSON.stringify(m));
await p.screenshot({ path: 'test-results/r352-mirror-zoom.png', clip: { x: m.clip.x - 4, y: m.clip.y - 4, width: m.clip.width + 8, height: m.clip.height + 8 } });
await b.close();
