import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
// wait for actual game world (canvas + no loading overlay)
for (let i = 0; i < 160; i++) {
  const ok = await pg.evaluate(() => {
    const c = document.querySelector('canvas');
    const boot = document.body.textContent.includes('Preparing the world') || document.body.textContent.includes('Painting the world');
    return !!c && !boot;
  });
  if (ok) break;
  await pg.waitForTimeout(1500);
}
await pg.waitForTimeout(3000);
for (let i = 0; i < 10; i++) {
  await pg.evaluate(() => document.querySelector('[data-nav-id="villageStash"]')?.click());
  await pg.waitForTimeout(1500);
  const ok = await pg.evaluate(() => !!document.querySelector('[data-hud-panel="villageStash"]'));
  if (ok) break;
}
await pg.waitForTimeout(3000);
const info = await pg.evaluate(() => {
  const p = document.querySelector('[data-hud-panel="villageStash"]');
  return { panel: !!p, rect: p?.getBoundingClientRect(), backdropImg: !!document.querySelector('img[src*="stash-mockup-backdrop"]') };
});
console.log(JSON.stringify(info));
await pg.screenshot({ path: '/tmp/dbg-game.png' });
await b.close();
