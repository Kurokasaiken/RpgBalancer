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
await pg.screenshot({ path: `${G}/live-full.png` });
await pg.screenshot({ path: `${G}/live-nav.png`, clip: { x: 480, y: 770, width: 480, height: 130 } });
await pg.screenshot({ path: `${G}/live-corner.png`, clip: { x: 1240, y: 810, width: 200, height: 90 } });
await pg.screenshot({ path: `${G}/live-topbar.png`, clip: { x: 40, y: 0, width: 900, height: 90 } });
await pg.screenshot({ path: `${G}/live-poi-cluster.png`, clip: { x: 750, y: 380, width: 480, height: 300 } });
// stash panel open for item icons
await pg.evaluate(() => document.querySelector('[data-nav-id="villageStash"]')?.click());
for (let i = 0; i < 20; i++) {
  const ok = await pg.evaluate(() => !!document.querySelector('[data-hud-panel="villageStash"]'));
  if (ok) break;
  await pg.waitForTimeout(1000);
}
await pg.waitForTimeout(1500);
await pg.screenshot({ path: `${G}/live-stash.png`, clip: { x: 15, y: 80, width: 430, height: 420 } });
await b.close();
console.log('done');
