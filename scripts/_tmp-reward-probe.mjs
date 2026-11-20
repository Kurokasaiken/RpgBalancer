import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-rovine', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-cassetto-debug], [data-testid="expedition-drawer-expand"]', { timeout: 30000 });
await p.waitForTimeout(1000);
const sel = await p.$('[data-cassetto-debug="select-first"]');
if (sel) { await p.evaluate((el) => el.click(), sel); await p.waitForTimeout(3500); }
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(800); }
const m = await p.evaluate(() => {
  const c = document.querySelector('[data-hudreal-cassetto]');
  const cr = c.getBoundingClientRect();
  const r = (e) => e ? { x: Math.round(e.getBoundingClientRect().x - (cr.right - 421)), w: Math.round(e.getBoundingClientRect().width) } : null;
  const sv = document.querySelector('[data-testid="cassetto-success-pct"]');
  const sp = sv?.parentElement?.parentElement;
  return {
    artRight: Math.round(cr.right),
    rewardCell: r(sp),
    successPct: r(sv),
    successTxt: sv?.textContent,
  };
});
console.log(JSON.stringify(m));
await b.close();
