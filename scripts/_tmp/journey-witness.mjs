import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 3 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://localhost:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 90000 });
const el = p.locator('[data-block="journey-strip"]').first();
await el.waitFor({ timeout: 60000 });
await p.waitForTimeout(2000);
/* Witness-only: open every clipping ancestor so the full column paints. */
await p.evaluate(() => {
  const strip = document.querySelector('[data-block="journey-strip"]');
  for (let n = strip; n && n !== document.body; n = n.parentElement) {
    const s = getComputedStyle(n);
    if (s.overflow === 'hidden' || s.overflowY === 'hidden' || s.overflowX === 'hidden') {
      n.style.overflow = 'visible'; n.style.overflowX = 'visible'; n.style.overflowY = 'visible';
    }
    if (s.height !== 'auto' && n instanceof HTMLElement) n.style.height = 'auto';
  }
  document.querySelector('[data-lab-id="cassetto"]')?.scrollIntoView({ block: 'start' });
});
await p.waitForTimeout(500);
await el.screenshot({ path: 'public/witness/charter-review/v4-1440-journey.png' });
console.log(JSON.stringify({ errs }, null, 1));
await b.close();
