import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
await p.goto('http://localhost:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-testid="place-village-hit"]', { timeout: 90000 });
await p.waitForTimeout(5000);
let ok = false;
for (let i = 0; i < 10 && !ok; i += 1) {
  const e = await p.evaluate(() => document.querySelector('[data-testid="place-village-hit"]')?.getAttribute('aria-expanded'));
  if (e !== 'true') await p.evaluate(() => document.querySelector('[data-testid="place-village-hit"]').click());
  try { await p.waitForSelector('[data-testid="place-radial-disc"]', { state: 'attached', timeout: 5000 }); ok = true; } catch { await p.waitForTimeout(1000); }
}
console.log(await p.evaluate(() => {
  const disc = document.querySelector('[data-testid="place-radial-disc"]');
  const svg = disc.querySelector('svg');
  // lista ogni path/image del gruppo clip con indice, fill e bbox angolare approssimata
  const items = [];
  let k = 0;
  svg.querySelectorAll('path, image').forEach(el => {
    const bb = el.getBBox ? (() => { try { return el.getBBox(); } catch { return null; } })() : null;
    items.push({
      k: k++, tag: el.tagName,
      fill: el.getAttribute('fill') || el.getAttribute('href') || '',
      testid: el.getAttribute('data-testid') || '',
      bb: bb ? `${bb.x | 0},${bb.y | 0} ${bb.width | 0}x${bb.height | 0}` : '-',
    });
  });
  return items.filter(i => i.bb !== '-').slice(0, 40);
}));
await b.close();
