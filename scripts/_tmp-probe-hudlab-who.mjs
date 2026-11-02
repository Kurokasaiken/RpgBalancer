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
const info = await p.evaluate(() => {
  const app = window.__pixiApp;
  const world = app.stage.children.find(c => c.children?.length > 3) ?? app.stage.children[0];
  const desc = (c) => {
    const b = c.getLocalBounds?.() ?? {};
    const kids = (c.children ?? []).map(k => (k.label ?? k.constructor?.name) + (k.texture?.source?.label ? `(${k.texture.source.label})` : '')).slice(0, 12);
    return { label: c.label ?? c.constructor?.name, type: c.constructor?.name, z: c.zIndex, x: Math.round(b.x ?? 0), y: Math.round(b.y ?? 0), w: Math.round(b.width ?? 0), h: Math.round(b.height ?? 0), kids };
  };
  return [44,45,46,47,48,49,50,51,52,53,54,55,56,57,60].map(i => ({ i, ...desc(world.children[i]) }));
});
console.log(JSON.stringify(info, null, 1));
await b.close();
