import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => document.querySelectorAll('[data-poi-zanara]').length >= 1, { timeout: 180000 });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const els = Array.from(document.querySelectorAll('[data-poi-zanara]'));
  return els.map((el) => {
    let n = el;
    let wrapper = null;
    while (n && n.parentElement) {
      n = n.parentElement;
      if (n.dataset && (n.dataset.worldX !== undefined || n.dataset.worldY !== undefined)) { wrapper = { wx: n.dataset.worldX, wy: n.dataset.worldY, transform: n.style.transform }; break; }
    }
    const r = el.getBoundingClientRect();
    return { fam: el.getAttribute('data-poi-zanara'), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), w: Math.round(r.width), wrapper };
  });
});
console.log(JSON.stringify(out, null, 1));
await b.close();
