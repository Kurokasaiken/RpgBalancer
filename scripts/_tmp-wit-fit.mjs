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
await pg.screenshot({ path: '/tmp/fit-full.png' });
await b.close();
