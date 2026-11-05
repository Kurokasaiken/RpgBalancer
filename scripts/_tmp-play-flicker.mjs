import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-02';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 750 } });
p.setDefaultTimeout(90000);
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 });
await p.waitForTimeout(4000); // let GPU warm-up finish
await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'village'); e?.click(); });
await p.waitForTimeout(500);
await p.evaluate(() => { window.__worldCamCtl.set({ panX: 1515 - 720 / 1.2, panY: 720 - 450 / 1.2, zoom: 1.2 }); });
// press play (steps at 2.5s); screenshot mid-transition frames
await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'play'); e?.click(); });
for (let i = 0; i < 6; i++) {
  await p.waitForTimeout(2300);
  await p.screenshot({ path: `${OUT}/play-f${i}.png` });
}
await b.close(); console.log('done');
