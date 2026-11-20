import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-testid="expedition-drawer"]', { timeout: 30000 }).catch(() => null);
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(1000); }
const m = await p.evaluate(() => {
  const out = {};
  for (const sel of ['[data-hudslot="cassetto"]', '[data-testid="expedition-drawer"]', '[data-testid="expedition-drawer-slide"]', '[data-hudreal-cassetto]']) {
    const el = document.querySelector(sel);
    if (el) { const r = el.getBoundingClientRect(); out[sel] = { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) }; }
  }
  const col = document.querySelector('[data-hudreal-cassetto]');
  out.colChildren = col ? Array.from(col.children).slice(0,3).map(c => ({ cls: c.className?.slice?.(0,40), w: Math.round(c.getBoundingClientRect().width) })) : [];
  return out;
});
console.log(JSON.stringify(m, null, 1));
await b.close();
