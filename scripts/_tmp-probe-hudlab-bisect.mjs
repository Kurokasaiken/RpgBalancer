import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5173/hud-lab';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 400)));
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
// dump the world layer tree
const tree = await p.evaluate(() => {
  const app = window.__pixiApp;
  if (!app) return { err: 'no __pixiApp' };
  const world = app.stage.children.find(c => c.children?.length > 3) ?? app.stage.children[0];
  return world.children.map((c, i) => ({
    i,
    label: c.label ?? c.constructor?.name,
    z: c.zIndex,
    type: c.constructor?.name,
    n: c.children?.length ?? 0,
    visible: c.visible,
  }));
});
console.log(JSON.stringify(tree, null, 1));
await b.close();
