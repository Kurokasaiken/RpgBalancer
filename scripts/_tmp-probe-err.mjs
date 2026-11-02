import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)); });
p.on('pageerror', e => errs.push('PAGEERR ' + String(e).slice(0, 200)));
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 40; i++) { if (await p.evaluate(() => !!document.querySelector('canvas'))) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(4000);
console.log(errs.slice(0, 15).join('\n') || 'no errors');
await b.close();
