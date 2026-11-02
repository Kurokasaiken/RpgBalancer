import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !!document.querySelector('canvas'))) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(3000);
await p.keyboard.press('h').catch(() => {});
await p.mouse.move(700, 160);
for (let i = 0; i < 7; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(200); }
await p.waitForTimeout(1200);
const r = await p.evaluate(() => {
  const app = window.__pixiApp;
  let shade = [], clar = [];
  app.stage.children.forEach((c, i) => {
    (c.children ?? []).forEach(k => { if (k.zIndex === 3) shade.push([i, k.alpha]); if (k.zIndex === 3.5) clar.push([i, k.alpha]); });
  });
  return { shade, clar, tops: app.stage.children.map((c, i) => [i, c.children?.length ?? 0]) };
});
console.log(JSON.stringify(r));
await b.close();
