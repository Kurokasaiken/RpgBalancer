/* Witness finale rev7 — pozzi marmo C3 sul cassetto reale (hud-compose). */
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
  return { x: col.x, y: 0, w: col.width, h: 900 };
});
await p.screenshot({ timeout: 120000, path: 'test-results/cassetto-rev7-marmo-c3.png', clip: { x: Math.max(0, crop.x), y: 0, width: crop.w, height: 900 } });
console.log('witness ok, errs:', errs.length, errs.slice(0,2).join('|'));
await b.close();
