import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-01-all';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0,200)));
p.on('console', (m) => { if (m.type() === 'error') console.log('[pg-err]', m.text().slice(0, 160)); });
for (let att = 0; att < 3; att++) {
  await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
  try { await p.waitForFunction(() => window.__worldCam && window.__worldCamCtl, { timeout: 90000 }); break; }
  catch { console.log('boot retry', att); await p.waitForTimeout(3000); }
}
await p.waitForTimeout(2500);
await p.evaluate(() => {
  const zoom = 1.5;
  window.__worldCamCtl.set({ panX: 1615 - 720 / zoom, panY: 700 - 450 / zoom, zoom });
});
await p.waitForTimeout(800);
await p.click('button:has-text("village")');
await p.waitForTimeout(400);
const clickBtn = (t) => p.evaluate((x) => { const b = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === x); if (b) { b.click(); return true; } return false; }, t);
const shot = async (n) => { await p.waitForTimeout(1100); await p.screenshot({ path: `${OUT}/${n}.png` }); };
for (const g of ['meadow', 'cottages', 'straw', 'stone']) { console.log('g', g, await clickBtn(g)); await shot(`g-${g}`); }
for (const [def, combos] of [
  ['palisade', ['none+none', 'wood+none', 'none+wood', 'wood+wood', 'stone+none', 'none+stone', 'wood+stone', 'stone+wood', 'stone+stone']],
  ['wall',     ['none+none', 'wood+none', 'none+wood', 'wood+wood', 'stone+none', 'none+stone', 'wood+stone', 'stone+wood', 'stone+stone']],
]) {
  console.log('def', def, await clickBtn(def));
  for (const c of combos) { console.log('  c', c, await clickBtn(c)); await shot(`${def}-${c.replace('+', '_')}`); }
}
await b.close();
console.log('done all 22');
