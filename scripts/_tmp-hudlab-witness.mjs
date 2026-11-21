import { chromium } from 'playwright';
const url = 'http://localhost:5173/hud-lab';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
const errors = [];
p.on('pageerror', e => errors.push(String(e).slice(0, 300)));
p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForSelector('[data-lab-card]', { timeout: 30000 });
await p.waitForTimeout(4000); // let mounts/fixtures settle
const stats = await p.evaluate(() => ({
  cards: document.querySelectorAll('[data-lab-card]').length,
  mounts: document.querySelectorAll('[data-lab-mount]').length,
  byStatus: [...document.querySelectorAll('[data-lab-card]')].reduce((a, c) => {
    const s = c.getAttribute('data-lab-status'); a[s] = (a[s] ?? 0) + 1; return a;
  }, {}),
  byKind: [...document.querySelectorAll('[data-lab-card]')].reduce((a, c) => {
    const k = c.getAttribute('data-lab-kind'); a[k] = (a[k] ?? 0) + 1; return a;
  }, {}),
  scrollH: document.querySelector('[data-lab-scroller]')?.scrollHeight ?? 0,
}));
console.log('STATS', JSON.stringify(stats));
console.log('ERRORS', JSON.stringify(errors.slice(0, 8)));
await p.screenshot({ path: 'test-results/hud-lab/plan129-witness-top.png' });
await p.evaluate(() => { const s = document.querySelector('[data-lab-scroller]'); s.scrollTop = s.scrollHeight / 2; });
await p.waitForTimeout(800);
await p.screenshot({ path: 'test-results/hud-lab/plan129-witness-mid.png' });
await p.evaluate(() => { const s = document.querySelector('[data-lab-scroller]'); s.scrollTop = s.scrollHeight; });
await p.waitForTimeout(800);
await p.screenshot({ path: 'test-results/hud-lab/plan129-witness-bottom.png' });
await b.close();
