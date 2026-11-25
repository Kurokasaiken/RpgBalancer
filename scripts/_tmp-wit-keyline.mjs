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
await pg.screenshot({ path: '/tmp/keyline-full.png' });
// zoom in on the map: find canvas and wheel-in a few times centered on a POI
const box = await (await pg.$('canvas')).boundingBox();
await pg.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.45);
for (let i = 0; i < 4; i++) { await pg.mouse.wheel(0, -260); await pg.waitForTimeout(700); }
await pg.waitForTimeout(1200);
await pg.screenshot({ path: '/tmp/keyline-near.png' });
await b.close();
