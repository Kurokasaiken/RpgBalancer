import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 120; i++) {
  const n = await pg.evaluate(() => document.querySelectorAll('[data-nav-id]').length);
  if (n > 0) break;
  await pg.waitForTimeout(1500);
}
await pg.waitForTimeout(2000);
await pg.evaluate(() => document.querySelector('[data-nav-id="villageStash"]')?.click());
for (let i = 0; i < 40; i++) {
  const ok = await pg.evaluate(() => !!document.querySelector('[data-hud-panel="villageStash"]'));
  if (ok) break;
  await pg.waitForTimeout(1000);
}
await pg.waitForTimeout(4000);
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/live-stash-1to1.png' });
await b.close();
