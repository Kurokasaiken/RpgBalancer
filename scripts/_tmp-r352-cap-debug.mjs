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
const r = await p.evaluate(() => {
  const clip = document.querySelector('[data-testid="chrome-res-cap-mirror"]');
  const img = clip?.querySelector('img');
  const res = document.querySelector('[data-testid="chrome-resources"]');
  const cr = clip?.getBoundingClientRect(), ir = img?.getBoundingClientRect(), rr = res?.getBoundingClientRect();
  return {
    clip: cr && { l: +cr.left.toFixed(1), t: +cr.top.toFixed(1), w: +cr.width.toFixed(1), h: +cr.height.toFixed(1) },
    img: ir && { l: +ir.left.toFixed(1), t: +ir.top.toFixed(1), w: +ir.width.toFixed(1), h: +ir.height.toFixed(1) },
    res: rr && { l: +rr.left.toFixed(1), t: +rr.top.toFixed(1) },
    imgTransform: img ? getComputedStyle(img).transform : null,
    imgRelToClip: cr && ir ? +(ir.left - cr.left).toFixed(1) : null,
  };
});
console.log(JSON.stringify(r, null, 1));
const cr = await p.evaluate(() => document.querySelector('[data-testid="chrome-res-cap-mirror"]').getBoundingClientRect().toJSON());
await p.screenshot({ path: 'test-results/r352-mirror-el.png', clip: { x: cr.x - 2, y: cr.y - 2, width: cr.width + 4, height: cr.height + 4 } });
await b.close();
