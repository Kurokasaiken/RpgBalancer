import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCam, undefined, { timeout: 300000 });
await p.waitForTimeout(2000);
console.log('cam:', JSON.stringify(await p.evaluate(() => window.__worldCam)));
await p.mouse.move(700, 500);
for (let i = 0; i < 4; i += 1) { await p.mouse.wheel(0, -400); await p.waitForTimeout(250); }
await p.waitForTimeout(600);
console.log('cam after zoom:', JSON.stringify(await p.evaluate(() => window.__worldCam)));
const t = await p.evaluate(() => {
  const el = document.querySelector('[data-quest-poi-id="poi-goblin"] [data-poi-zanara]');
  let w = el; while (w && w.parentElement && w.dataset?.worldX === undefined) w = w.parentElement;
  return w?.style.transform;
});
console.log('wrapper transform:', t);
await b.close();
