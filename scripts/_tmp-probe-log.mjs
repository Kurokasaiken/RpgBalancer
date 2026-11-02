import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 700 } });
const logs = [];
p.on('console', m => { const t = m.text(); if (t.includes('[pwm]')) logs.push(t); });
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 90; i++) { if (!(await p.evaluate(() => document.body.innerText.includes('warmup')))) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(1500);
console.log(logs.join('\n') || 'NO PWM LOG');
await b.close();
