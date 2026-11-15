import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
await p.goto('http://localhost:5173/game?tod=night', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 60; i++) {
  if (await p.evaluate(() => !!document.querySelector('[data-map-ready]'))) { console.log('ready at', i); break; }
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(6000);
const diag = await p.evaluate(() => {
  const app = window.__pixiApp;
  if (!app) return 'no app';
  const out = [];
  const walk = (n, depth) => {
    out.push(`${'  '.repeat(depth)}${n.constructor.name} z=${n.zIndex} vis=${n.visible} a=${+(n.alpha ?? 1).toFixed(2)} blend=${n.blendMode} kids=${n.children?.length ?? '-'}`);
    for (const c of n.children ?? []) if (depth < 2) walk(c, depth + 1);
  };
  walk(app.stage, 0);
  return out.filter(l => !/kids=0/.test(l) || /z=20|multiply|add/.test(l)).slice(0, 60);
});
console.log(Array.isArray(diag) ? diag.join('\n') : diag);
await b.close();
