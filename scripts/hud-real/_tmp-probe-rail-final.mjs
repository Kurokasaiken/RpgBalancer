import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text()); });
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
// Wait for the world: canvas mounted, expedition hooks exposed, veil fully gone.
await page.waitForFunction(
  () => document.querySelectorAll('canvas').length > 0 &&
        typeof window.__idleVillageTestHooks?.expedition?.['poi-goblin']?.openDetail === 'function' &&
        document.querySelectorAll('[data-testid="game-boot-screen"]').length === 0,
  null,
  { timeout: 150000, polling: 1000 },
);
console.log('world ready');
await page.waitForTimeout(1500);
console.log('assignments pre:', JSON.stringify(await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].getAssignments())));
await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
await page.waitForSelector('[data-hudreal-cassetto]', { state: 'attached', timeout: 10000 });
await page.waitForSelector('[data-testid^="slot-button-"]', { state: 'attached', timeout: 10000 });
await page.waitForTimeout(1200);
console.log('cassetto:', await page.locator('[data-hudreal-cassetto]').count(), '| member picker:', await page.locator('[data-testid="resident-roster-panel"]').count());
// Close the session member picker so the rail rows are physically reachable.
// Rows covered by the picker can't receive pointerdown — use the LAST row,
//  which sits below the picker's footprint. Verify coverage first.
// baldassarre is uncovered and eligible on member-1/bodyguard (probed).
const row = page.locator('[data-testid="rail-roster-row-villager-baldassarre"] button');
const slot = page.locator('[data-testid^="slot-button-"]').nth(1);
const rowId = await row.evaluate((el) => el.closest('[data-testid^="rail-roster-row-"]')?.getAttribute('data-testid'));
const rb = await row.boundingBox(); const sb = await slot.boundingBox();
console.log('dragging row:', rowId, '| row:', JSON.stringify(rb), 'slot:', JSON.stringify(sb));
const cover = await page.evaluate(({ x, y }) => {
  const el = document.elementFromPoint(x, y);
  return el ? el.tagName + '|' + (el.closest('[data-testid]')?.getAttribute('data-testid') ?? 'no-testid') + '|' + el.outerHTML.slice(0, 140) : 'none';
}, { x: rb.x + rb.width / 2, y: rb.y + rb.height / 2 });
console.log('topmost at row center:', cover);
const sx = rb.x + rb.width / 2, sy = rb.y + rb.height / 2;
const tx = sb.x + sb.width / 2, ty = sb.y + sb.height / 2;
await page.mouse.move(sx, sy);
await page.mouse.down();
await page.waitForTimeout(250);
console.log('cursorOffset set:', await page.evaluate(() => Boolean((window).__dragCursorOffset)));
for (let i = 1; i <= 16; i++) {
  await page.mouse.move(sx + ((tx - sx) * i) / 16, sy + ((ty - sy) * i) / 16);
  await page.waitForTimeout(60);
}
await page.waitForTimeout(500);
console.log('aria-pressed:', await row.getAttribute('aria-pressed').catch(() => 'n/a'), '| dragging id:', await page.evaluate(() => window.__idleVillageTestHooks.getDraggingResidentId?.()));
await page.screenshot({ path: 'test-results/rail-final-mid.png' });
await page.mouse.up();
await page.waitForTimeout(2600);
console.log('assignments post:', JSON.stringify(await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].getAssignments())));
console.log('medals:', await page.locator('[data-testid^="slot-medal-"] img').count());
await page.screenshot({ path: 'test-results/rail-final-end.png' });
// TAP path: plain click on an uncovered row must still run the production
// tap-to-assign (flight to first accepting slot), not be eaten by the drag.
const tapRow = page.locator('[data-testid="rail-roster-row-villager-lisetta"] button');
await tapRow.click({ force: true });
await page.waitForTimeout(2200);
console.log('assignments after tap:', JSON.stringify(await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].getAssignments())));
await page.screenshot({ path: 'test-results/rail-final-tap.png' });
console.log('errors:', errors.length, errors.slice(0, 5));
await b.close();
