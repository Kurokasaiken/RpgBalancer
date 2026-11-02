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
const info = await p.evaluate(() => {
  const app = window.__pixiApp;
  const world = app.stage.children.find(c => c.children?.length > 3) ?? app.stage.children[0];
  return world.children.map((c, i) => ({ i, z: c.zIndex, v: c.visible, a: c.alpha?.toFixed?.(2) })).filter(c => c.z >= 3 && c.z <= 4);
});
console.log(JSON.stringify(info));
// toggla lo z 3.5
await p.evaluate(() => {
  const app = window.__pixiApp;
  const world = app.stage.children.find(c => c.children?.length > 3) ?? app.stage.children[0];
  window.__c = world.children.filter(c => c.zIndex === 3.5);
});
const nc = await p.evaluate(() => window.__c.length);
console.log('clarity found:', nc);
if (nc) {
  await p.evaluate(() => window.__c.forEach(c => c.visible = false));
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/c-off.png' });
  await p.evaluate(() => window.__c.forEach(c => c.visible = true));
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/c-on.png' });
}
await b.close();
