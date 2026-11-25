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
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/emblems2/live-full-nav.png' });
const r = await pg.evaluate(() => {
  const nav = document.querySelector('nav') || document.querySelector('[class*="nav"]');
  const svgs = [...document.querySelectorAll('svg')].filter(s => { const r = s.getBoundingClientRect(); return r.width > 10 && r.width < 80 && r.y > innerHeight * 0.6; });
  return svgs.slice(0, 8).map(s => { const r = s.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
});
console.log(JSON.stringify(r));
await b.close();
