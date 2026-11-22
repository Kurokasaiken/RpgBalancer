import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-hudreal-cassetto]', { timeout: 30000 }).catch(() => null);
await p.waitForTimeout(1500);
const info = await p.evaluate(() => {
  const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  return {
    cassetto: q('[data-hudreal-cassetto]'),
    column: q('[data-cassetto-column]'),
    slot: q('[data-hudslot="cassetto"]'),
    drawer: q('[data-testid="expedition-drawer"]'),
    slide: q('[data-testid="expedition-drawer-slide"]'),
    expandChip: q('[data-testid="expedition-drawer-expand"]'),
    canvas: q('canvas'),
    cta: q('[data-testid="cassetto-confirm"]'),
    rack: q('[data-testid="resident-slot-rack"]'),
    vignette: q('[data-cassetto-vignette]'),
  };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
