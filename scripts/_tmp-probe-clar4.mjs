import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !!document.querySelector('canvas'))) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(3000);
const r = await p.evaluate(() => {
  const app = window.__pixiApp;
  const found = { z3: [], z35: [] };
  const walk = (n, path) => {
    if (n.zIndex === 3) found.z3.push(path);
    if (n.zIndex === 3.5) found.z35.push(path);
    (n.children ?? []).forEach((k, i) => walk(k, path + '/' + i));
  };
  app.stage.children.forEach((c, i) => walk(c, String(i)));
  return found;
});
console.log(JSON.stringify(r));
await b.close();
