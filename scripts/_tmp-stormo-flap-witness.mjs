import { chromium } from '@playwright/test';
// PLAN-108 remount-6 witness: sample the live sprite's atlas frame index after a
// manual stormo trigger — must cycle through all 6 cells (4 before remount).
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl && window.__ambientDebug?.stormo, null, { timeout: 90000 });
await p.evaluate(({ wx, wy, Z }) =>
  window.__worldCamCtl.set({ panX: wx - 1440 / (2 * Z), panY: wy - 900 / (2 * Z), zoom: Z }),
  { wx: 1105, wy: 1112, Z: 2.5 });
await p.evaluate(() => window.__ambientDebug.director.triggerStormo('to-meadow-sw'));
await p.waitForFunction(() => window.__ambientDebug.stormo.activeCount() > 0, null, { timeout: 10000 });
// sample frame indices: flapHz=9 → new frame every ~111ms; poll ~40ms for 3s
const seen = await p.evaluate(async () => {
  const idx = new Set();
  const cell = window.__ambientDebug.stormo.frames?.[0]?.frame?.width ?? 400;
  const t0 = performance.now();
  while (performance.now() - t0 < 20000 && idx.size < 6) {
    const f = window.__ambientDebug.stormo.flocks.find((q) => q.active);
    if (f) {
      const fr = f.birds[0].sp.texture.frame;
      idx.add(Math.round(fr.x / cell));
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  return [...idx].sort((a, b2) => a - b2);
});
console.log('frame indices seen:', JSON.stringify(seen));
await p.screenshot({ path: 'test-results/plan-108-stormo/flap-6frames-zoom.png' });
console.log(seen.length >= 6 ? 'WITNESS OK: 6-frame cycle live' : 'WITNESS FAIL: only ' + seen.length + ' frames');
await b.close();
