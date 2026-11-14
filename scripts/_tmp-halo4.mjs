import { chromium } from 'playwright';
const OUT = 'test-results/poi-zanara-live';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await pg.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded' });
await pg.waitForSelector('[data-poi-zanara]', { timeout: 90000 });
await pg.waitForFunction(() => {
  const els = document.querySelectorAll('[data-world-x]');
  return [...els].every(e => e.style.transform && e.style.transform !== 'none');
}, null, { timeout: 60000 });
await pg.keyboard.press('3');
await pg.waitForTimeout(3000);
const marks = await pg.$$eval('[data-poi-zanara]', els => els.map(e => {
  const r = e.getBoundingClientRect();
  return { fam: e.getAttribute('data-poi-zanara'), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width };
}));
for (const [i, m] of marks.entries()) {
  const cx = Math.min(Math.max(m.x, 90), 1510), cy = Math.min(Math.max(m.y, 90), 910);
  await pg.screenshot({ path: `${OUT}/halo4-${i}-${m.fam}.png`, clip: { x: cx - 90, y: cy - 90, width: 180, height: 180 } });
}
await pg.screenshot({ path: `${OUT}/halo4-full.png` });
console.log('done', marks.length);
await b.close();
