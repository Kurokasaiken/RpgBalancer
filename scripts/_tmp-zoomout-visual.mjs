import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForFunction(() => window.__worldCam && window.__worldCamCtl, null, { timeout: 180000 });
await p.waitForSelector('[data-map-ready="true"]', { timeout: 60000 }).catch(() => {});
await p.waitForTimeout(3000);
await p.mouse.move(720, 450);
for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(30); }
await p.waitForTimeout(600);
const cam = await p.evaluate(() => ({ ...window.__worldCam }));
console.log('resting zoom after max wheel-out:', cam.zoom.toFixed(4), 'fitZoom:', cam.fitZoom.toFixed(4));
await p.screenshot({ path: 'test-results/r331-zoom/max-zoomout.png' });
await b.close();
