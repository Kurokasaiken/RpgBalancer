import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-rovine', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-testid="expedition-drawer-expand"], [data-hudreal-cassetto]', { timeout: 30000 });
await p.waitForTimeout(1200);
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(800); }
const m = await p.evaluate(() => {
  const rv = document.querySelector('[data-testid="cassetto-risk-value"]');
  const col = rv.parentElement; const cell = col.parentElement;
  const cs = getComputedStyle(cell); const ccs = getComputedStyle(col);
  const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.width)].join('/') };
  return {
    cellRect: r(cell), cellPad: cs.paddingLeft, cellJustify: cs.justifyContent,
    colRect: r(col), colW: ccs.width, colMargin: ccs.marginLeft,
    rvText: rv.textContent, rvRect: r(rv),
  };
});
console.log(JSON.stringify(m, null, 1));
await b.close();
