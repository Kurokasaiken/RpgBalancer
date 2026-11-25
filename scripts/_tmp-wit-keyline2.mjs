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
await pg.waitForTimeout(2500);
const rects = await pg.evaluate(() =>
  [...document.querySelectorAll('[data-poi-zanara]')].map((e) => {
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }));
console.log(JSON.stringify(rects));
// zoom near on first visible POI
const t = rects.find((r) => r.x > 200 && r.x < 1000 && r.y > 150 && r.y < 700) || rects[0];
if (t) {
  await pg.mouse.move(t.x + t.w / 2, t.y + t.h / 2);
  for (let i = 0; i < 5; i++) { await pg.mouse.wheel(0, -280); await pg.waitForTimeout(650); }
  await pg.waitForTimeout(1000);
  const rects2 = await pg.evaluate(() =>
    [...document.querySelectorAll('[data-poi-zanara]')].map((e) => {
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }).filter((r) => r.x > -r.w && r.x < 1440 && r.y > -r.h && r.y < 900));
  console.log('NEAR', JSON.stringify(rects2.slice(0, 6)));
  const v = rects2.sort((a, z) => z.w - a.w)[0];
  if (v) {
    const pad = v.w * 0.6;
    await pg.screenshot({ path: '/tmp/keyline-poi-near.png', clip: { x: Math.max(0, v.x - pad), y: Math.max(0, v.y - pad), width: Math.min(1440, v.w + 2 * pad), height: Math.min(900, v.h + 2 * pad) } });
  }
}
await b.close();
