import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const OUT = 'test-results/witness-perquest';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 160)));
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-testid="expedition-drawer-expand"], [data-hudreal-cassetto]', { timeout: 30000 });
await p.waitForTimeout(1200);
const sel = await p.$('[data-cassetto-debug="select-first"]');
if (sel) { await p.evaluate((el) => el.click(), sel); await p.waitForTimeout(3500); }
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(900); }
const m = await p.evaluate(() => {
  const c = document.querySelector('[data-hudreal-cassetto]');
  const cr = c.getBoundingClientRect();
  const art = [...c.querySelectorAll('*')].find(e => Math.abs(e.getBoundingClientRect().height - innerHeight) < 2 && e.getBoundingClientRect().width < cr.width);
  const chip = document.querySelector('[data-testid="expedition-drawer-collapse"]')?.getBoundingClientRect();
  const outbound = [...c.querySelectorAll('span')].find(s => /outbound/i.test(s.textContent))?.getBoundingClientRect();
  return {
    el: { x: Math.round(cr.x), w: Math.round(cr.width) },
    art: art ? { x: Math.round(art.getBoundingClientRect().x), w: Math.round(art.getBoundingClientRect().width) } : null,
    chipRight: chip ? Math.round(1440 - chip.right) : null,
    outbound: outbound ? { x: Math.round(outbound.x), w: Math.round(outbound.width) } : null,
    deathPct: c.querySelector('[data-testid="cassetto-death-pct"]')?.textContent ?? null,
  };
});
console.log(JSON.stringify(m));
await p.screenshot({ path: `${OUT}/cassetto-fixed-1440x900.png` });
const art2 = await p.$('[data-hudreal-cassetto] > div');
if (art2) await art2.screenshot({ path: `${OUT}/cassetto-fixed-column-crop.png` });
await b.close();
console.log('DONE');
