import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 150)));
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-hudreal-cassetto]', { timeout: 45000 });
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); }
await p.waitForSelector('[data-cassetto-column]', { timeout: 15000 });
await p.waitForTimeout(2500);
const info = await p.evaluate(() => {
  const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  return {
    slot: q('[data-hudslot="cassetto"]'),
    column: q('[data-cassetto-column]'),
    cta: q('[data-testid="cassetto-confirm"]'),
    rack: q('[data-testid="resident-slot-rack"]'),
    partyBlock: q('[data-block="party-slots"]'),
    bagBlock: q('[data-block="bag-slots"]'),
    journey: q('[data-block="journey-strip"]'),
    risk: q('[data-testid="cassetto-risk-well"]'),
    reward: q('[data-testid="cassetto-reward-well"]'),
    canvas: q('canvas'),
  };
});
console.log(JSON.stringify(info, null, 1));
await p.screenshot({ path: '/tmp/cass-empty.png' });
// close-up of the column
const col = await p.$('[data-cassetto-column]');
if (col) await col.screenshot({ path: '/tmp/cass-column.png' });
const dbg = await p.$('[data-cassetto-debug="select-first"]');
if (dbg) { for (let i = 0; i < 4; i++) { await dbg.dispatchEvent('click'); await p.waitForTimeout(600); } }
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/cass-party.png' });
if (col) await col.screenshot({ path: '/tmp/cass-column-party.png' });
console.log('errs', errs.slice(0, 5));
await b.close();
