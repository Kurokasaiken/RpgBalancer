import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const OUT = 'test-results/witness-perquest';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
for (const poi of ['poi-goblin', 'poi-rovine']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 160)));
  await p.goto(`http://localhost:5173/hud-compose?comp=cassetto&poi=${poi}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('[data-cassetto-debug], [data-testid="expedition-drawer-expand"]', { timeout: 30000 });
  await p.waitForTimeout(1000);
  const sel = await p.$('[data-cassetto-debug="select-first"]');
  if (sel) { await p.evaluate((el) => el.click(), sel); await p.waitForTimeout(3500); }
  const exp = await p.$('[data-testid="expedition-drawer-expand"]');
  if (exp) { await exp.click(); await p.waitForTimeout(900); }
  const m = await p.evaluate(() => {
    const c = document.querySelector('[data-hudreal-cassetto]');
    const rv = c.querySelector('[data-testid="cassetto-risk-value"]');
    const cell = rv?.parentElement?.parentElement?.getBoundingClientRect();
    const rr = rv?.getBoundingClientRect();
    return {
      risk: rv?.textContent, riskInCell: rr && cell ? rr.x >= cell.x && rr.x + rr.width <= cell.x + cell.width + 2 : null,
      deathPct: c.querySelector('[data-testid="cassetto-death-pct"]')?.textContent ?? null,
      successPct: c.querySelector('[data-testid="cassetto-success-pct"]')?.textContent ?? null,
      labels: [...c.querySelectorAll('[data-slot-id]')].map(() => null) && [...c.querySelectorAll('p')].map(e => e.textContent).filter(t => /leader|fighter|scout|body|porter/i.test(t)).slice(0, 4),
    };
  });
  console.log(poi, JSON.stringify(m));
  const col = await p.$('[data-hudreal-cassetto] > div');
  if (col) await col.screenshot({ path: `${OUT}/final-${poi}-column.png` });
  await p.close();
}
await b.close();
console.log('DONE');
