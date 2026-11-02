import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5173/hud-lab';
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
await p.mouse.move(760, 200);
for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(200); }
await p.waitForTimeout(1000);
const clip = { x: 350, y: 0, width: 800, height: 260 };
await p.evaluate(() => {
  const app = window.__pixiApp;
  const world = app.stage.children.find(c => c.children?.length > 3) ?? app.stage.children[0];
  window.__world = world;
});
for (const i of [48, 49, 50, 52, 54, 55]) {
  await p.evaluate((i) => { window.__world.children[i].visible = false; }, i);
  await p.waitForTimeout(350);
  await p.screenshot({ path: `/tmp/solo-off-${i}.png`, clip });
  await p.evaluate((i) => { window.__world.children[i].visible = true; }, i);
}
await b.close();
