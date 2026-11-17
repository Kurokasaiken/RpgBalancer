import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
const ready = () => page.waitForFunction(() => document.querySelectorAll('canvas').length > 0
  && typeof window.__idleVillageTestHooks?.expedition?.['poi-goblin']?.openDetail === 'function'
  && document.querySelectorAll('[data-testid="game-boot-screen"]').length === 0
  && document.querySelectorAll('[data-testid="roster-stash-rail"]').length > 0, null, { timeout: 150000, polling: 1000 });
await ready();
await page.waitForTimeout(800);
console.log('rail mounted:', await page.locator('[data-testid="roster-stash-rail"]').count());
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
    await page.waitForSelector('[data-testid^="slot-button-"]', { state: 'attached', timeout: 12000 });
    break;
  } catch (e) {
    console.log(`openDetail attempt ${attempt} failed (${String(e).slice(0, 80)}), re-waiting…`);
    await ready();
  }
}
await page.waitForTimeout(1500);
const pickerCount = await page.locator('[data-testid="drag-test-container"]').count();
const railVisible = await page.locator('[data-testid="roster-stash-rail"]').isVisible();
const rows = await page.locator('[data-testid^="rail-roster-row-"]').all();
const box = await rows[0].boundingBox();
const rowId = await rows[0].getAttribute('data-testid');
const topInfo = await page.evaluate((r) => {
  const el = document.elementFromPoint(r.x, r.y);
  let cur = el, chain = [];
  while (cur && chain.length < 6) { chain.push(cur.dataset?.testid || cur.id || cur.tagName); cur = cur.parentElement; }
  return chain.join(' < ');
}, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
console.log(JSON.stringify({ pickerCount, railVisible, rowCount: rows.length, rowId, rowAt: { x: Math.round(box.x), y: Math.round(box.y) }, topmostAtRowCenter: topInfo }));
await page.screenshot({ path: 'test-results/hud-real/rail-overlap-fixed.png' });
console.log('errors:', errors.length, errors.slice(0, 3));
await b.close();
