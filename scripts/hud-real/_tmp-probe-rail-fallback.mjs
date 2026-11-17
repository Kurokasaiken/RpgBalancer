import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
const ready = () => page.waitForFunction(() => document.querySelectorAll('canvas').length > 0
  && typeof window.__idleVillageTestHooks?.expedition?.['poi-goblin']?.openDetail === 'function'
  && document.querySelectorAll('[data-testid="game-boot-screen"]').length === 0
  && (document.querySelectorAll('[data-testid="roster-stash-rail"], [data-testid="rail-expand-chip"]').length > 0), null, { timeout: 150000, polling: 1000 });
await ready();
await page.waitForTimeout(600);
// Collapse the rail to the chip (fallback condition)
if (await page.locator('[data-testid="rail-collapse-chip"]').count()) {
  await page.locator('[data-testid="rail-collapse-chip"]').click({ force: true });
  await page.waitForSelector('[data-testid="rail-expand-chip"]', { state: 'attached', timeout: 5000 });
}
console.log('rail collapsed to chip:', await page.locator('[data-testid="rail-expand-chip"]').count());
await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
await page.waitForSelector('[data-testid^="slot-button-"]', { state: 'attached', timeout: 12000 });
await page.waitForTimeout(1500);
const pickerCount = await page.locator('[data-testid="drag-test-container"]').count();
console.log(JSON.stringify({ pickerWithCollapsedRail: pickerCount }));
await page.screenshot({ path: 'test-results/hud-real/rail-collapsed-picker-fallback.png' });
console.log('errors:', errors.length, errors.slice(0, 3));
await b.close();
