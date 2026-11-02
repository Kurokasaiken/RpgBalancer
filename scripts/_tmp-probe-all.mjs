import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 700 } });
const logs = [];
p.on('console', m => logs.push(m.type() + ':' + m.text().slice(0, 120)));
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) { if (!(await p.evaluate(() => document.body.innerText.includes('warmup')))) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(1500);
const bc = await p.evaluate(() => ({ bc: window.__pixiBuildCount, app: !!window.__pixiApp }));
console.log('buildCount:', JSON.stringify(bc));
console.log('msgs:', logs.length, logs.slice(0, 10).join(' | '));
await b.close();
