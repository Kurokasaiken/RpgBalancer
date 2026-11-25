import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 });
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
await pg.evaluate(() => {
  document.querySelectorAll('img').forEach(i => { if (i.src.includes('/emblems/')) i.style.display = 'none'; });
});
await pg.waitForTimeout(300);
await pg.screenshot({ path: '/tmp/sig4.png', clip: { x: 930, y: 290, width: 115, height: 110 } });
await b.close();
console.log('done');
