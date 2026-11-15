import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 40000 }).catch(() => {});
await page.waitForTimeout(5000);
const info = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="hud-director-trigger"]');
  if (!el) return 'absent';
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  const cs = getComputedStyle(el);
  return { rect: r, hitTag: hit?.tagName, hitTestId: hit?.dataset?.testid ?? hit?.closest('[data-testid]')?.dataset?.testid, pe: cs.pointerEvents, vis: cs.visibility, disp: cs.display };
});
console.log(JSON.stringify(info));
// try real DOM click
await page.evaluate(() => document.querySelector('[data-testid="hud-director-trigger"]')?.click());
await page.waitForTimeout(600);
console.log('panel after dom click:', await page.locator('[data-testid="director-panel"]').count());
await b.close();
