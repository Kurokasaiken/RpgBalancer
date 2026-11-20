import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1050, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('[data-expedition-sheet]', { state: 'attached', timeout: 45000 });
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]')?.click());
await p.waitForTimeout(5000);
await p.locator('[data-testid="expedition-sheet-toggle"]').click();
await p.waitForTimeout(1400);
await p.screenshot({ path: 'test-results/r357-phase8-witness/w1050-sheet-expanded.png' });
const r = await p.locator('[data-testid="cassetto-risk-value"]').boundingBox();
if (r) {
  const clip = { x: Math.max(0, r.x-90), y: Math.max(0, r.y-40), width: 320, height: 130 };
  clip.width = Math.min(clip.width, 1050 - clip.x);
  clip.height = Math.min(clip.height, 900 - clip.y);
  await p.screenshot({ path: 'test-results/r357-phase8-witness/w1050-sheet-risk.png', clip });
}
await b.close();
