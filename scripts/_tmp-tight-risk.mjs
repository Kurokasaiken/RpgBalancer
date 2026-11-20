import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('[data-hudreal-cassetto]', { state: 'attached', timeout: 45000 });
await p.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]')?.click());
await p.waitForTimeout(6000);
const dump = await p.evaluate(() => {
  const el = (s) => { const e = document.querySelector(s); return e ? e.textContent.trim() : 'MISSING'; };
  return {
    risk: el('[data-testid="cassetto-risk-value"]'),
    death: el('[data-testid="cassetto-death-pct"]'),
    success: el('[data-testid="cassetto-success-pct"]'),
    deathBox: document.querySelector('[data-testid="cassetto-death-pct"]')?.getBoundingClientRect(),
  };
});
console.log(JSON.stringify(dump, null, 1));
const de = await p.locator('[data-testid="cassetto-death-pct"]').boundingBox();
const se = await p.locator('[data-testid="cassetto-success-pct"]').boundingBox();
if (de) await p.screenshot({ path: 'test-results/r357-phase8-witness/tight-death.png', clip: { x: de.x-70, y: de.y-30, width: 190, height: 80 } });
if (se) await p.screenshot({ path: 'test-results/r357-phase8-witness/tight-success.png', clip: { x: se.x-140, y: se.y-30, width: 200, height: 80 } });
await b.close();
