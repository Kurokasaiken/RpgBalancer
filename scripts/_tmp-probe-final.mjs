import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1400, height: 800 } });
const logs = [];
p.on('console', m => { if (m.text().includes('[pwm]')) logs.push(m.text()); });
p.on('pageerror', e => logs.push('ERR ' + String(e).slice(0, 150)));
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 90; i++) { if (await p.evaluate(() => !document.body.innerText.includes('warmup') && window.__pixiApp)) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(15000);
const kids = await p.evaluate(() => {
  const w = window.__pixiApp.stage.children[0];
  let z3 = 0, z35 = 0;
  const walk = n => { if (n.zIndex === 3) z3++; if (n.zIndex === 3.5) z35++; (n.children ?? []).forEach(walk); };
  walk(w);
  return { n: w.children.length, z3, z35 };
});
const err = await p.evaluate(() => document.body.innerText.slice(0, 300));
console.log(JSON.stringify(kids));
console.log(logs.join('\n'));
console.log('PAGE:', err.slice(0, 120).replace(/\n/g, ' '));
await b.close();
