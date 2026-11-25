import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 160; i++) {
  const ok = await pg.evaluate(() => {
    const c = document.querySelector('canvas');
    const t = document.body.textContent;
    return !!c && !t.includes('Preparing the world') && !t.includes('Painting the world');
  });
  if (ok) break;
  await pg.waitForTimeout(1500);
}
await pg.waitForTimeout(3000);
const G = '.mw/runs/20261124-poi-nav-icone/gen/emblems2';
await pg.screenshot({ path: `${G}/live-full3.png` });
const box = await pg.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find(i => i.src.includes('sterminio-skull-pike'));
  if (!img) return null;
  const r = img.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('emblem box:', JSON.stringify(box));
if (box) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2, half = 130;
  await pg.screenshot({ path: `${G}/live-sterminio-zoom.png`, clip: { x: Math.max(0,cx-half), y: Math.max(0,cy-half), width: half*2, height: half*2 } });
}
await b.close();
console.log('done');
