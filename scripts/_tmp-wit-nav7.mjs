import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/game', { waitUntil: 'load', timeout: 60000 });
await pg.waitForTimeout(20000);
for (let i = 0; i < 160; i++) {
  let ok = false;
  try { ok = await pg.evaluate(() => !!document.querySelector('[data-hudreal-nav]') || !!document.querySelector('nav')); } catch {}
  if (ok) break;
  await pg.waitForTimeout(1500);
}
await pg.waitForTimeout(3000);
const r = await pg.evaluate(() => {
  const n = document.querySelector('[data-hudreal-nav]') || document.querySelector('nav');
  if (!n) return null;
  const b = n.getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
});
console.log(JSON.stringify(r));
await pg.screenshot({ path: '/tmp/nav-full.png' });
await b.close();
