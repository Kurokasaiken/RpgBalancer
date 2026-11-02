import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-01-v4';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl && document.querySelectorAll('button').length > 10, { timeout: 120000 });
await p.waitForTimeout(3000);
await p.evaluate(() => { const z = 1.4; window.__worldCamCtl.set({ panX: 1515 - 720 / z, panY: 720 - 450 / z, zoom: z }); });
await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'village'); e?.click(); });
await p.waitForTimeout(500);
const click = (t) => p.evaluate((x) => { const e = [...document.querySelectorAll('button')].find((b2) => b2.textContent.trim() === x); e?.click(); return !!e; }, t);
for (const [label, name] of [['cottages · palisade · —', '03-cottages-palisade'], ['straw · wall · —', '04-straw-wall'], ['meadow · — · —', '05-meadow']]) {
  console.log(name, await click(label));
  await p.waitForTimeout(7000);
  await p.screenshot({ path: `${OUT}/${name}.png` });
}
await b.close(); console.log('done');
