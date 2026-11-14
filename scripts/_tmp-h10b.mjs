import { chromium } from 'playwright';
const OUT = 'test-results/poi-zanara-live';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await pg.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 150000 });
await pg.waitForSelector('[data-poi-zanara]', { state: 'attached', timeout: 180000 });
await pg.waitForFunction(() => [...document.querySelectorAll('[data-world-x]')].every(e => e.style.transform && e.style.transform !== 'none'), null, { timeout: 120000 });
await pg.addStyleTag({ content: '[class*="veil"],[data-boot-veil],#boot-veil{display:none!important}' });
await pg.keyboard.press('3');
await pg.waitForTimeout(2500);
const marks = await pg.$$eval('[data-poi-zanara]', els => els.map(e => { const r = e.getBoundingClientRect(); return { fam: e.getAttribute('data-poi-zanara'), x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
console.log(JSON.stringify(marks));
for (const [i, m] of marks.entries()) {
  const cx = Math.min(Math.max(m.x, 90), 1510), cy = Math.min(Math.max(m.y, 90), 910);
  await pg.screenshot({ path: `${OUT}/halo10-${i}-${m.fam}.png`, clip: { x: cx - 90, y: cy - 90, width: 180, height: 180 } });
}
await pg.screenshot({ path: `${OUT}/halo10-full.png` });
console.log('done');
await b.close();
