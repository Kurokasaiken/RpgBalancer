import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
let n = 0;
p.on('framenavigated', (f) => { if (f === p.mainFrame()) console.log(`[nav ${++n}]`, new Date().toISOString().slice(11, 19)); });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
const t0 = Date.now();
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 18; i++) {
  await p.waitForTimeout(5000);
  const s = await p.evaluate(() => ({ ready: !!document.querySelector('[data-map-ready]'), canvas: !!document.querySelector('canvas'), cam: !!window.__worldCam })).catch(() => null);
  console.log(`t=${Math.round((Date.now() - t0) / 1000)}s`, JSON.stringify(s));
  if (s?.ready) break;
}
await b.close();
