import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl && window.__ambientDebug?.stormo, null, { timeout: 90000 });
// zoom on the meadow takeoff (1105,1112 world px)
const cam = (wx, wy, Z) => p.evaluate(({ wx, wy, Z }) =>
  window.__worldCamCtl.set({ panX: wx - 1440 / (2 * Z), panY: wy - 900 / (2 * Z), zoom: Z }), { wx, wy, Z });
await cam(1105, 1112, 2.5);
await p.evaluate(() => window.__ambientDebug.director.triggerStormo('to-meadow-sw'));
await p.waitForTimeout(1500);
await p.screenshot({ path: 'test-results/plan-108-stormo/stormo-climb-zoom.png' });
await p.waitForTimeout(4000); // ~55-60% of lifeSec[9..13]
await p.screenshot({ path: 'test-results/plan-108-stormo/stormo-midflight-zoom.png' });
// fit view
await p.evaluate(() => { window.__worldCamCtl.set({ panX: 0, panY: 0, zoom: 1 }); window.__worldCamCtl.refit?.(); });
await p.evaluate(() => window.__ambientDebug.director.triggerStormo('to-meadow-sw'));
await p.waitForTimeout(2500);
await p.screenshot({ path: 'test-results/plan-108-stormo/stormo-midflight-fit.png' });
// OFF: toggle 'birds' off in the sky tab, reload, confirm empty sky
await p.getByRole('button', { name: 'sky', exact: true }).click().catch(() => {});
const tg = p.locator('label', { hasText: 'birds' }).locator('input');
if (await tg.count() && await tg.isChecked()) await tg.uncheck();
await p.waitForTimeout(300);
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl, null, { timeout: 90000 });
await p.waitForTimeout(2000);
await p.screenshot({ path: 'test-results/plan-108-stormo/sky-off-fit.png' });
const dbg = await p.evaluate(() => ({ stormo: !!window.__ambientDebug?.stormo }));
console.log('dbg', JSON.stringify(dbg));
await b.close();
console.log('done');
