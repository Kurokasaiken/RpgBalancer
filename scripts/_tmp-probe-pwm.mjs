import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 700 } });
const logs = [];
p.on('console', m => { if (m.text().includes('[pwm]')) logs.push(m.text()); });
p.on('pageerror', e => logs.push('ERR ' + String(e).slice(0, 150)));
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !document.body.innerText.includes('warmup') && window.__pixiApp)) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(8000);
console.log(logs.join('\n'));
await b.close();
