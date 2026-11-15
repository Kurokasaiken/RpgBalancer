import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 30; i++) { if (await p.$('[data-cassetto-rack]')) break; await p.waitForTimeout(1000); }
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const rack = document.querySelector('[data-cassetto-rack]');
  const zone = rack?.getBoundingClientRect();
  const grid = rack?.querySelector('[data-testid="resident-slot-rack"]')?.getBoundingClientRect();
  const tokens = [...(rack?.querySelectorAll('[data-testid="resident-slot-rack"] > *') ?? [])].map(el => {
    const r = el.getBoundingClientRect();
    // include overflowing children (medallion img)
    const kids = [...el.querySelectorAll('*')].map(k => k.getBoundingClientRect());
    const union = kids.reduce((u, k) => ({
      left: Math.min(u.left, k.left), right: Math.max(u.right, k.right),
      top: Math.min(u.top, k.top), bottom: Math.max(u.bottom, k.bottom),
    }), { left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    return { cell: { x: r.x, y: r.y, w: r.width, h: r.height }, union };
  });
  return { zone, grid, tokens: tokens.map(t => ({ cell: t.cell, union: { x: t.union.left, y: t.union.top, r: t.union.right, b: t.union.bottom } })) };
});
console.log(JSON.stringify(info, null, 1).slice(0, 3000));
await b.close();
