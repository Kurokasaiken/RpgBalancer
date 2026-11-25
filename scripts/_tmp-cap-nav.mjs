import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 100; i++) {
  const s = await pg.evaluate(() => ({
    phase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? null,
    canvas: !!document.querySelector('canvas'),
  })).catch(() => null);
  if (!s || (s.phase === null && s.canvas)) break;
  await pg.waitForTimeout(2000);
}
await pg.waitForTimeout(4000);
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/live-poi-overflow2.png' });
await b.close();
console.log('done');
