import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) {
  const done = await p.evaluate(() => !!document.querySelector('canvas'));
  if (done) break;
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(3000);
await p.keyboard.press('h').catch(() => {});
await p.mouse.move(700, 160);
for (let i = 0; i < 7; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(200); }
await p.waitForTimeout(1200);
const n = await p.evaluate(() => {
  const app = window.__pixiApp;
  const world = app.stage.children.find(c => c.children?.length > 3) ?? app.stage.children[0];
  let hits = [];
  world.children.forEach((c, i) => { if (c.texture?.source?.url?.includes('mountain-clarity')) hits.push(i); });
  window.__clar = hits.map(i => world.children[i]);
  return hits;
});
console.log('clarity sprites:', JSON.stringify(n));
await p.screenshot({ path: '/tmp/clar-on.png' });
await p.evaluate(() => window.__clar.forEach(c => c.visible = false));
await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/clar-off.png' });
await b.close();
