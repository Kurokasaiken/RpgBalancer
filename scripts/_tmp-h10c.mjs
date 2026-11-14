import { chromium } from 'playwright';
const OUT = 'test-results/poi-zanara-live';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
pg.on('pageerror', e => console.log('PAGEERROR:', e.message.slice(0, 200)));
await pg.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 180000 });
await pg.waitForFunction(() => window.__worldCam && window.__worldCam.zoom > 0, null, { timeout: 240000 });
await pg.waitForTimeout(3000);
const marks = await pg.$$eval('[data-poi-zanara]', els => els.map(e => { const r = e.getBoundingClientRect(); return { fam: e.getAttribute('data-poi-zanara'), x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
console.log(JSON.stringify(marks));
for (const [i, m] of marks.entries()) {
  const cx = Math.min(Math.max(m.x, 90), 1510), cy = Math.min(Math.max(m.y, 90), 910);
  await pg.screenshot({ path: `${OUT}/halo10-${i}-${m.fam}.png`, timeout: 120000, clip: { x: cx - 90, y: cy - 90, width: 180, height: 180 } });
}
await pg.screenshot({ path: `${OUT}/halo10-full.png`, timeout: 120000 });
console.log('done');
await b.close();
