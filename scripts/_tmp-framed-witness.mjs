import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 160)));
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-rovine', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-cassetto-debug], [data-testid="expedition-drawer-expand"]', { timeout: 30000 });
await p.waitForTimeout(1200);
const sel = await p.$('[data-cassetto-debug="select-first"]');
if (sel) { await p.evaluate((el) => el.click(), sel); await p.waitForTimeout(3500); }
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(900); }
const m = await p.evaluate(() => {
  const c = document.querySelector('[data-hudreal-cassetto]');
  const art = [...c.querySelectorAll('*')].map(e => e.getBoundingClientRect()).find(r => r.width > 300 && r.width < 600 && r.height > 800);
  return { artW: art ? Math.round(art.width) : null, deathPct: c.querySelector('[data-testid="cassetto-death-pct"]')?.textContent ?? null };
});
console.log(JSON.stringify(m));
const col = await p.$('[data-hudreal-cassetto] > div');
if (col) await col.screenshot({ path: 'test-results/witness-perquest/framed-rovine-column.png' });
await b.close();
console.log('DONE');
