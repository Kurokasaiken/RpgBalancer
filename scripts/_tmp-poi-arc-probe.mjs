import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => document.querySelectorAll('[data-poi-zanara]').length >= 5, undefined, { timeout: 240000 });
const snap = () => p.evaluate(() => Array.from(document.querySelectorAll('[data-poi-zanara]')).map((el) => {
  const path = el.querySelector('svg path');
  const circle = el.querySelector('svg circle');
  return { fam: el.getAttribute('data-poi-zanara'), d: path ? path.getAttribute('d') : (circle ? 'FULL' : 'EMPTY'), stroke: path ? path.getAttribute('stroke') : null };
}));
const a = await snap();
await p.keyboard.press('3'); /* speeds[2] = ×4 */
await p.waitForTimeout(20000);
const c = await snap();
let changed = 0;
for (let i = 0; i < a.length; i += 1) if (JSON.stringify(a[i]) !== JSON.stringify(c[i])) changed += 1;
console.log(`changed ${changed}/${a.length}`);
console.log('T0   ', JSON.stringify(a));
console.log('T+20s', JSON.stringify(c));
await b.close();
