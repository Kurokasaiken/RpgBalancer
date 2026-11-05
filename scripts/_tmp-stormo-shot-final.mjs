import { chromium } from '@playwright/test';
// R-316: exact replica of the accepted flap witness framing (cam 980,960 z6)
// + two extra shots to catch gather (~1s) and formed (~4s) states.
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.__worldCamCtl && window.__ambientDebug?.stormo, null, { timeout: 240000 });
await p.getByRole('button', { name: 'Hide test UI' }).click().catch(() => {});
await p.evaluate(({ wx, wy, Z }) =>
  window.__worldCamCtl.set({ panX: wx - 1440 / (2 * Z), panY: wy - 900 / (2 * Z), zoom: Z }),
  { wx: 980, wy: 960, Z: 6 });
await p.evaluate(() => window.__ambientDebug.director.triggerStormo('to-meadow-sw'));
await p.waitForFunction(() => window.__ambientDebug.stormo.activeCount() > 0, null, { timeout: 20000 });
await p.waitForTimeout(800);
await p.screenshot({ path: 'test-results/plan-108-stormo/r316-a.png' });
await p.waitForTimeout(1200);
await p.screenshot({ path: 'test-results/plan-108-stormo/r316-b.png' });
await p.waitForTimeout(1200);
await p.screenshot({ path: 'test-results/plan-108-stormo/r316-c.png' });
const g = await p.evaluate(() => {
  const f = window.__ambientDebug.stormo.flocks.find((q) => q.active);
  return f ? f.root.getGlobalPosition() : null;
});
console.log('flock global', JSON.stringify(g));
await b.close();
console.log('done');
