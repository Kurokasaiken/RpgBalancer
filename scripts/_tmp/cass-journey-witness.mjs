import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.setDefaultTimeout(120000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 150)));
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74', { waitUntil: 'domcontentloaded', timeout: 120000 });
const exp = await p.waitForSelector('[data-testid="expedition-drawer-expand"]', { timeout: 30000 }).catch(() => null);
if (exp) await exp.click();
await p.waitForSelector('[data-cassetto-column]', { state: 'attached' });
await p.waitForTimeout(3500);
const crop = await p.evaluate(() => {
  const col = document.querySelector('[data-cassetto-column]').getBoundingClientRect();
  const j = document.querySelector('[data-block="journey-strip"]').getBoundingClientRect();
  return { x: col.x, y: j.y - 4, w: col.width, h: j.height + 8 };
});
await p.screenshot({ timeout: 120000, path: 'test-results/journey-keyed-witness.png', clip: { x: Math.max(0, crop.x), y: crop.y, width: crop.w, height: crop.h } });
console.log('witness ok errs:', errs.length);
await b.close();
