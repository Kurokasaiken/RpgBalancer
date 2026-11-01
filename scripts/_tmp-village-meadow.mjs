import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (let att = 0; att < 3; att++) {
  await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
  try { await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 }); break; } catch { console.log('retry', att); }
}
await p.waitForTimeout(2500);
await p.evaluate(() => { const z = 1.5; window.__worldCamCtl.set({ panX: 1615 - 720 / z, panY: 700 - 450 / z, zoom: z }); });
await p.click('button:has-text("village")');
await p.waitForTimeout(400);
await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === 'meadow'); b?.click(); });
await p.waitForTimeout(9000); // let the cross-fade fully settle
await p.screenshot({ path: 'test-results/village-witness-2026-11-01-all/g-meadow-settled.png' });
await b.close(); console.log('done');
