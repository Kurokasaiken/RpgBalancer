import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-rovine', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-testid="expedition-drawer-expand"], [data-hudreal-cassetto]', { timeout: 30000 });
await p.waitForTimeout(1200);
const sel = await p.$('[data-cassetto-debug="select-first"]');
if (sel) { await p.evaluate((el) => el.click(), sel); await p.waitForTimeout(3500); }
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(800); }
const m = await p.evaluate(() => {
  const rv = document.querySelector('[data-testid="cassetto-risk-value"]');
  const cell = rv?.parentElement?.parentElement;
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const sw = document.querySelector('[data-testid="cassetto-success-pct"]');
  const rew = sw?.closest('div')?.parentElement;
  return { riskCell: r(cell), riskText: r(rv), riskLabel: rv?.textContent, rewardCell: rew ? r(rew) : null,
    death: document.querySelector('[data-testid="cassetto-death-pct"]')?.textContent ?? null };
});
console.log(JSON.stringify(m));
const rv = await p.$('[data-testid="cassetto-risk-value"]');
const cell = await rv.evaluateHandle((e) => e.parentElement.parentElement);
await cell.asElement().screenshot({ path: 'test-results/witness-perquest/risk-cell-zoom.png' }).catch(()=>{});
await b.close();
