import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
// wait for nav buttons to exist (boot done)
for (let i = 0; i < 120; i++) {
  const n = await pg.evaluate(() => document.querySelectorAll('[data-nav-id]').length);
  if (n > 0) break;
  await pg.waitForTimeout(1500);
}
await pg.waitForTimeout(2000);
const ids = await pg.evaluate(() => [...document.querySelectorAll('[data-nav-id]')].map(e => e.getAttribute('data-nav-id')));
console.log('nav ids', JSON.stringify(ids));
await pg.evaluate(() => document.querySelector('[data-nav-id="villageStash"],[data-nav-id="stash"]')?.click());
await pg.waitForTimeout(2500);
const panel = await pg.evaluate(() => {
  const p = document.querySelector('[data-hud-panel="villageStash"]');
  if (!p) return null;
  const r = p.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log('panel', JSON.stringify(panel));
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/live-stash-1to1.png' });
await b.close();
