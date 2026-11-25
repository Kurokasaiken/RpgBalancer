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
const info = await pg.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.src.includes('/emblems/'));
  const out = imgs.map(i => { const r = i.getBoundingClientRect(); return { src: i.src.split('/').pop(), cx: r.x+r.width/2, cy: r.y+r.height/2 }; });
  imgs.forEach(i => i.style.display = 'none');
  return out;
});
console.log(JSON.stringify(info));
await pg.waitForTimeout(400);
await pg.screenshot({ path: '/tmp/sig5-full.png' });
await b.close();
console.log('done');
