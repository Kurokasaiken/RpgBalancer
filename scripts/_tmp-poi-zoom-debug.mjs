import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => document.querySelectorAll('[data-poi-zanara]').length >= 1, undefined, { timeout: 300000 });
await p.waitForTimeout(4000);
const probe = () => p.evaluate(() => {
  const el = document.querySelector('[data-quest-poi-id="poi-goblin"] [data-poi-zanara]');
  let w = el; while (w && w.parentElement && w.dataset?.worldX === undefined) w = w.parentElement;
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), zoomExp: w?.dataset?.zoomExp, transform: w?.style.transform, cam: window.__worldCam?.zoom, fit: window.__worldCam ? 'n/a' : 'no-seam' };
});
console.log('before:', JSON.stringify(await probe()));
await p.mouse.move(700, 500);
for (let i = 0; i < 6; i += 1) { await p.mouse.wheel(0, -400); await p.waitForTimeout(250); }
await p.waitForTimeout(800);
console.log('after :', JSON.stringify(await probe()));
await b.close();
