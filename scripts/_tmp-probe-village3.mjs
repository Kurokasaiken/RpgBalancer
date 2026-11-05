import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl && window.__pixiApp, null, { timeout: 90000 });
await p.waitForTimeout(5000);
const pos = await p.evaluate(() => {
  let hit = null;
  const find = (c) => { for (const ch of c.children) { if (ch.label === 'village-zone') hit = { x: ch.x, y: ch.y, w: ch.width, h: ch.height, gp: ch.getGlobalPosition() }; find(ch); } };
  find(window.__pixiApp.stage);
  const cam = window.__worldCamCtl.get ? window.__worldCamCtl.get() : window.__worldCamCtl;
  return { hit, cam };
});
console.log(JSON.stringify(pos, null, 1));
// centre on the village-zone bounds in world coords
const g = pos.hit.gp;
const cx = g.x + pos.hit.w / 2, cy = g.y + pos.hit.h / 2;
await p.evaluate(({ cx, cy }) => window.__worldCamCtl.set({ panX: cx - 1440 / 4, panY: cy - 900 / 4, zoom: 2 }), { cx, cy });
await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/vill-zoom.png' });
// step to stone|wall|stone+stone via the timeline slider (last step)
const sld = p.locator('input[type=range]').last();
if (await sld.count()) { await sld.fill('9'); }
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/vill-zoom-ss.png' });
await b.close();
console.log('done');
