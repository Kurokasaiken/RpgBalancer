import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[PAGEERR]', String(e).slice(0, 400)));
await p.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'commit' });
for (let i = 0; i < 24; i++) {
  await p.waitForTimeout(5000);
  const ok = await p.evaluate(() => Boolean(window.__worldCam));
  if (ok) { console.log('worldCam OK after', (i + 1) * 5, 's'); break; }
  if (i === 23) console.log('worldCam NEVER');
}
await p.evaluate(() => window.__worldCamCtl?.set({ panX: 1515 - 720, panY: 700 - 450, zoom: 1 }));
await p.waitForTimeout(1200);
const hit = p.locator('[data-testid="place-village-hit"]');
if (await hit.count()) { await hit.first().click({ force: true }); await p.waitForTimeout(900); }
const fc = p.locator('[data-testid="place-fancards"]');
console.log('fancards:', await fc.count());
const box = await fc.first().boundingBox().catch(() => null);
if (box) {
  const pad = 70;
  await p.screenshot({ path: 'test-results/poi-luogo-fancards/fancards-zoom-1440x900.png', clip: {
    x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
    width: Math.min(1440 - Math.max(0, box.x - pad), box.width + pad * 2),
    height: Math.min(900 - Math.max(0, box.y - pad), box.height + pad * 2) } });
  console.log('shot saved', JSON.stringify(box));
}
await b.close();
