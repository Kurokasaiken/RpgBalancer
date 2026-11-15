import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 40000 }).catch(() => {});
await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 40000 }).catch(() => {});
await page.waitForSelector('[data-testid="map-quest-poi"]', { timeout: 40000 }).catch(() => {});
await page.waitForTimeout(1200);
/* open the goblin cassetto — first quest POI marker */
const markers = page.locator('[data-testid="map-quest-poi"]');
console.log('markers:', await markers.count());
await markers.first().click({ force: true }).catch(() => {});
await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 12000 }).catch(() => {});
await page.waitForTimeout(900);
console.log('cassetto:', await page.locator('[data-hudreal-cassetto]').count());
const row = page.locator('[data-testid^="rail-roster-row-"] button').first();
const slot = page.locator('[data-testid^="slot-button-"]').first();
const rb = await row.boundingBox().catch(() => null);
const sb = await slot.boundingBox().catch(() => null);
console.log('row:', !!rb, 'slot:', !!sb);
if (rb && sb) {
  const sx = rb.x + rb.width / 2, sy = rb.y + rb.height / 2;
  const tx = sb.x + sb.width / 2, ty = sb.y + sb.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.waitForTimeout(300);
  for (let i = 1; i <= 14; i++) {
    await page.mouse.move(sx + ((tx - sx) * i) / 14, sy + ((ty - sy) * i) / 14);
    await page.waitForTimeout(45);
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/rail-drag-mid.png' });
  await page.mouse.up();
  await page.waitForTimeout(1600);
  const medals = await page.locator('[data-testid^="slot-medal-"] img').count();
  const assigned = await page.getByText(/assigned/i).count();
  console.log('slot medals:', medals, '| ASSIGNED labels:', assigned);
  await page.screenshot({ path: 'test-results/rail-drag-result.png' });
}
console.log('errors:', errors.length, errors.slice(0, 5));
await b.close();
