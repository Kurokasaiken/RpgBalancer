import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-cassetto-debug], [data-testid="expedition-drawer-expand"]', { timeout: 30000 });
await p.waitForTimeout(1500);
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(800); }
const m = await p.evaluate(() => {
  const c = document.querySelector('[data-hudreal-cassetto]');
  const img = c?.querySelector('img[src*="column"]') ?? c?.querySelector('img');
  const kids = [...(c?.children ?? [])].map(k => {
    const r = k.getBoundingClientRect(); return { tag: k.tagName, cls: (k.getAttribute('data-block') ?? k.className?.toString().slice(0,30)), x: Math.round(r.x), w: Math.round(r.width) };
  });
  const ir = img?.getBoundingClientRect();
  const vg = c?.querySelector('[data-cassetto-vignette]')?.getBoundingClientRect();
  const seat = c?.querySelector('[data-slot-id]')?.getBoundingClientRect();
  return {
    el: { x: Math.round(c.getBoundingClientRect().x), w: Math.round(c.getBoundingClientRect().width) },
    art: ir ? { x: Math.round(ir.x), w: Math.round(ir.width) } : null,
    vignette: vg ? { x: Math.round(vg.x), w: Math.round(vg.width) } : null,
    seat: seat ? { x: Math.round(seat.x), w: Math.round(seat.width) } : null,
    kids: kids.slice(0, 8),
  };
});
console.log(JSON.stringify(m, null, 1));
await b.close();
