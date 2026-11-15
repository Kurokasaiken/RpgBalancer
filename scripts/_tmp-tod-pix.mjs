import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
await p.goto('http://localhost:5173/game?tod=night', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 60; i++) {
  if (await p.evaluate(() => !!document.querySelector('[data-map-ready]'))) { console.log('ready at', i); break; }
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(15000);
const diag = await p.evaluate(() => {
  const app = window.__pixiApp;
  if (!app) return 'no app';
  const world = app.stage.children[0].children[0];
  const plates = world.children.filter(c => c.zIndex === 20).map(c => ({ blend: c.blendMode, vis: c.visible, a: +c.alpha.toFixed(3), w: c.width|0, h: c.height|0 }));
  const cv = document.querySelector('canvas');
  const c2 = document.createElement('canvas');
  c2.width = 64; c2.height = 40;
  const g = c2.getContext('2d');
  g.drawImage(cv, 0, 0, 64, 40);
  const d = g.getImageData(0, 0, 64, 40).data;
  let r = 0, gg = 0, bb = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i+1]; bb += d[i+2]; }
  const n = d.length / 4;
  return { plates, canvasAvg: { r: (r/n)|0, g: (gg/n)|0, b: (bb/n)|0 } };
});
console.log(JSON.stringify(diag, null, 1));
await b.close();
