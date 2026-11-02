import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-01-v4';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (let att = 0; att < 3; att++) {
  await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
  try { await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 }); break; } catch { console.log('retry', att); }
}
await p.waitForTimeout(2500);
await p.evaluate(() => { const z = 1.4; window.__worldCamCtl.set({ panX: 1515 - 720 / z, panY: 720 - 450 / z, zoom: z }); });
await p.click('button:has-text("village")');
await p.waitForTimeout(400);
const click = (t) => p.evaluate((x) => { const e = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === x || b.textContent.trim().startsWith(x)); e?.click(); return !!e; }, t);
const shot = async (n, w = 6000) => { await p.waitForTimeout(w); await p.screenshot({ path: `${OUT}/${n}.png` }); };
await p.screenshot({ path: `${OUT}/00-picker.png` });
await click('stone · wall · —'); await shot('01-wall-none');
await click('stone · wall · wood+stone'); await shot('02-wall-wood-stone');
await click('cottages · palisade · —'); await shot('03-cottages-palisade');
await click('straw · wall · —'); await shot('04-straw-wall');
await click('meadow · — · —'); await shot('05-meadow');
await b.close(); console.log('done');
