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
const info = await p.evaluate(() => {
  const app = window.__pixiApp;
  const world = app.stage.children.find(c => c.children?.length > 3) ?? app.stage.children[0];
  window.__world = world;
  return world.children.map((c, i) => `${i}:${c.label ?? c.constructor?.name}:z${c.zIndex}:n${c.children?.length ?? 0}`).join('\n');
});
console.log(info);
const clip = { x: 350, y: 0, width: 800, height: 260 };
for (const [lo, hi] of [[48, 56], [56, 64]]) {
  await p.evaluate(([lo, hi]) => {
    for (let i = lo; i < Math.min(hi, window.__world.children.length); i++) window.__world.children[i].visible = false;
  }, [lo, hi]);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/bisect3-off-${lo}-${hi}.png`, clip });
  await p.evaluate(([lo, hi]) => {
    for (let i = lo; i < Math.min(hi, window.__world.children.length); i++) window.__world.children[i].visible = true;
  }, [lo, hi]);
  await p.waitForTimeout(200);
}
await b.close();
