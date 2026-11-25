import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 150)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
// robust boot: wait for hook AND boot screen gone AND canvas present
await p.waitForFunction(() => {
  const e = window.__idleVillageTestHooks?.expedition?.['poi-goblin'];
  return Boolean(e && typeof e.openDetail === 'function') && !document.querySelector('[data-testid="game-boot-screen"]');
}, null, { timeout: 120000 });
await p.waitForTimeout(3000);
await p.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
await p.waitForSelector('[data-cassetto-column]', { state: 'attached', timeout: 60000 });
await p.waitForTimeout(4000);
// confirm no boot veil overlapping the column
const veil = await p.evaluate(() => Boolean(document.querySelector('[data-testid="game-boot-screen"]')));
const c = await p.evaluate(() => { const el = document.querySelector('[data-cassetto-column]'); const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await p.screenshot({ path: '.mw/runs/20261125-cassetto-final-witness/1280x800-empty-col-REPROBE.png', clip: { x: Math.max(0, c.x - 6), y: 0, width: c.w + 6, height: 800 } });
// disabled cursor check — computed style on the CTA
const cur = await p.evaluate(() => { const el = document.querySelector('[data-testid="cassetto-confirm"]'); return el ? getComputedStyle(el).cursor : 'missing'; });
console.log('veilPresent:', veil, '| ctaCursor:', cur, '| errs:', errs.length);
await b.close();
