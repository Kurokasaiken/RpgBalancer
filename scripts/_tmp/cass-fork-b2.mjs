/* Variante B2 — marmo leggibile: overlay .62 invece di .80, crop zoom sul pozzo party+risk. */
import { chromium } from 'playwright';
const OUT = '.mw/runs/20261125-cassetto-fork';
const WELLS = ['[data-block="party-slots"]', '[data-block="bag-slots"]', '[data-block="journey-strip"]', '[data-testid="cassetto-risk-well"]', '[data-testid="cassetto-reward-well"]'];
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(120000);
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74', { waitUntil: 'domcontentloaded', timeout: 120000 });
const exp = await page.waitForSelector('[data-testid="expedition-drawer-expand"]', { timeout: 20000 }).catch(() => null);
if (exp) await exp.click();
await page.waitForSelector('[data-cassetto-column]', { state: 'attached' });
await page.waitForTimeout(2000);
const bg = `linear-gradient(rgba(3,8,7,.62), rgba(3,8,7,.62)), url(/assets/ui/hud-real/slicekit/cassetto/ground.webp) center / cover no-repeat, #04222b`;
await page.evaluate(([selectors, background]) => {
  for (const sel of selectors) { const el = document.querySelector(sel); if (el) el.style.background = background; }
}, [WELLS, bg]);
await page.waitForTimeout(900);
const crop = await page.evaluate(() => {
  const col = document.querySelector('[data-cassetto-column]').getBoundingClientRect();
  const party = document.querySelector('[data-block="party-slots"]').getBoundingClientRect();
  const risk = document.querySelector('[data-block="risk-rewards"]').getBoundingClientRect();
  return { x: col.x, y: party.y - 8, w: col.width, h: (risk.y + risk.height) - party.y + 16 };
});
await page.screenshot({ timeout: 120000, path: `${OUT}/pozzi-B2-marmo-leggibile.png`, clip: { x: Math.max(0, crop.x), y: crop.y, width: crop.w, height: crop.h } });
// zoom crop: risk/reward row only, tight — the emptiest wells
const rw = await page.evaluate(() => {
  const el = document.querySelector('[data-block="risk-rewards"]').getBoundingClientRect();
  return { x: el.x - 4, y: el.y - 4, w: el.width + 8, h: el.height + 8 };
});
await page.screenshot({ timeout: 120000, path: `${OUT}/pozzi-B2-zoom-risk.png`, clip: { x: rw.x, y: rw.y, width: rw.w, height: rw.h } });
await browser.close();
console.log('B2 done');
