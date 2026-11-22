import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [], fails = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('requestfailed', (r) => fails.push(`${r.failure()?.errorText} ${r.url().slice(-80)}`));
p.on('response', (r) => { if (r.status() >= 400) fails.push(`${r.status()} ${r.url().slice(-80)}`); });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74&reward=4', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-cassetto-column]', { timeout: 120000 });
await p.waitForTimeout(3000);
const info = await p.evaluate(() => {
  const el = document.elementFromPoint(300, 400);
  const chain = []; let n = el;
  while (n && chain.length < 6) { chain.push(`${n.tagName}${n.id ? '#' + n.id : ''}${n.className && typeof n.className === 'string' ? '.' + n.className.split(' ').slice(0, 2).join('.') : ''}`); n = n.parentElement; }
  const canvas = [...document.querySelectorAll('canvas')].map((c) => ({ w: c.width, h: c.height }));
  const bg = getComputedStyle(el).background;
  return { chain, canvas, bg: bg.slice(0, 200) };
});
console.log(JSON.stringify(info, null, 1));
console.log('errs:', errs, 'fails:', fails.slice(0, 8));
await b.close();
