import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text()); });
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 40000 }).catch(() => {});
await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 40000 }).catch(() => {});
await page.waitForSelector('[data-testid="map-quest-poi"]', { timeout: 40000 }).catch(() => {});
await page.waitForTimeout(1200);
await page.locator('[data-testid="map-quest-poi"]').first().click({ force: true }).catch(() => {});
await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 12000 }).catch(() => {});
await page.waitForTimeout(900);
const row = page.locator('[data-testid^="rail-roster-row-"] button').first();
const slot = page.locator('[data-testid^="slot-button-"]').first();
const rb = await row.boundingBox().catch(() => null);
const sb = await slot.boundingBox().catch(() => null);
console.log('row:', !!rb, 'slot:', !!sb);
const info = await row.evaluate((el) => ({ aria: el.getAttribute('aria-roledescription'), disabled: el.getAttribute('aria-disabled'), role: el.getAttribute('role') }));
console.log('row attrs:', JSON.stringify(info));
if (rb && sb) {
  const sx = rb.x + rb.width / 2, sy = rb.y + rb.height / 2;
  const tx = sb.x + sb.width / 2, ty = sb.y + sb.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.waitForTimeout(200);
  console.log('cursorOffset set:', await page.evaluate(() => Boolean((window).__dragCursorOffset)));
  for (let i = 1; i <= 14; i++) {
    await page.mouse.move(sx + ((tx - sx) * i) / 14, sy + ((ty - sy) * i) / 14);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(400);
  const pressed = await row.getAttribute('aria-pressed').catch(() => 'n/a');
  const overlay = await page.locator('[class*="dnd"], [data-drag-overlay], [id*="DndDescribedBy"]').count();
  console.log('aria-pressed:', pressed, '| overlay-ish:', overlay);
  await page.screenshot({ path: 'test-results/rail-drag-mid.png' });
  await page.mouse.up();
  await page.waitForTimeout(1600);
  console.log('medals:', await page.locator('[data-testid^="slot-medal-"] img').count());
}
console.log('errors:', errors.length, errors.slice(0, 6));
await b.close();
