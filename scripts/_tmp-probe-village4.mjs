import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl && window.__pixiApp, null, { timeout: 90000 });
await p.waitForTimeout(5000);
// force state through the live object the overlay reads
const r = await p.evaluate(() => {
  const hits = [];
  const find = (c) => { for (const ch of c.children) { if (ch.label === 'village-zone') hits.push(ch); find(ch); } };
  find(window.__pixiApp.stage);
  // set village state via the exported live object if reachable
  const vl = window.villageZoneLive || window.__villageZoneLive;
  if (vl) { vl.growth='stone'; vl.defence='wall'; vl.towers='stone,stone'; vl.visible=true; }
  return { box: hits.length, hasLive: !!vl };
});
console.log(JSON.stringify(r));
await p.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 720, panY: 700 - 450, zoom: 1 }));
await p.waitForTimeout(1500);
// village zone at world 1260-1770 x 505-895; centre camera at village
await p.evaluate(() => window.__worldCamCtl.set({ panX: 1155, panY: 415, zoom: 2 }));
await p.waitForTimeout(1000);
await p.screenshot({ path: '/tmp/v4-zone.png', clip: { x: 400, y: 0, width: 1040, height: 900 } });
await b.close(); console.log('done');
