import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 90; i++) {
  const warm = await p.evaluate(() => document.body.innerText.includes('warmup'));
  if (!warm && await p.evaluate(() => !!document.querySelector('canvas'))) break;
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(3000);
const r = await p.evaluate(() => {
  const out = { canvases: document.querySelectorAll('canvas').length, found: [] };
  const apps = window.__pixiApps ?? (window.__pixiApp ? [window.__pixiApp] : []);
  for (const app of apps) {
    let n3 = 0, n35 = 0;
    const walk = n => { if (n.zIndex === 3) n3++; if (n.zIndex === 3.5) n35++; (n.children ?? []).forEach(walk); };
    walk(app.stage);
    out.found.push({ z3: n3, z35: n35 });
  }
  return out;
});
console.log(JSON.stringify(r));
await b.close();
