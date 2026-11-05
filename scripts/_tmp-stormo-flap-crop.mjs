import { chromium } from '@playwright/test';
// eye-witness crop: screenshot clipped around the live flock centroid
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl && window.__ambientDebug?.stormo, null, { timeout: 90000 });
await p.getByRole('button', { name: 'Hide test UI' }).click().catch(() => {});
await p.evaluate(({ wx, wy, Z }) =>
  window.__worldCamCtl.set({ panX: wx - 1440 / (2 * Z), panY: wy - 900 / (2 * Z), zoom: Z }),
  { wx: 980, wy: 960, Z: 6 });
await p.evaluate(() => window.__ambientDebug.director.triggerStormo('to-meadow-sw'));
await p.waitForFunction(() => window.__ambientDebug.stormo.activeCount() > 0, null, { timeout: 10000 });
await p.waitForTimeout(2500); // let it climb + fade in
const box = await p.evaluate(() => {
  const f = window.__ambientDebug.stormo.flocks.find((q) => q.active);
  if (!f) return null;
  const g = f.root.getGlobalPosition();
  return { x: g.x, y: g.y };
});
console.log('flock screen pos', JSON.stringify(box));
if (box) {
  await p.screenshot({ path: 'test-results/plan-108-stormo/flap-6frames-crop.png' });
  console.log('crop saved');
}
await b.close();
