import { chromium } from 'playwright';
const url = 'http://127.0.0.1:5173/hud-lab';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) {
  const done = await p.evaluate(() => !!document.querySelector('canvas') && !document.body.innerText.includes('loading map'));
  if (done) break;
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(3000);
await p.keyboard.press('h').catch(() => {});
await p.mouse.move(700, 170);
for (let i = 0; i < 7; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(200); }
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/peaks-now.png' });
await p.evaluate(() => {
  const app = window.__pixiApp;
  const world = app.stage.children.find(c => c.children?.length > 3) ?? app.stage.children[0];
  // hide surf mesh + regional weather to isolate
  world.children.forEach(c => { if (c.label === 'regional-weather') c.visible = false; });
});
await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/peaks-noweather.png' });
await b.close();
