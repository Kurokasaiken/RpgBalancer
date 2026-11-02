import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 90; i++) { if (!(await p.evaluate(() => document.body.innerText.includes('warmup')))) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(2000);
const r = await p.evaluate(() =>
  window.__pixiApp.stage.children[0].children.map((c, i) => `${i}:${c.constructor.name}${c.label ? '/' + c.label : ''}${c.zIndex ? '/z' + c.zIndex : ''}`).join(' | '));
console.log(r);
await b.close();
