import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 40000 }).catch(() => {});
await page.waitForTimeout(4000);
await page.waitForSelector('[data-quest-poi-id="poi-goblin"]', { state: 'visible', timeout: 60000 });
const click = async (sel) => {
  const box = await page.locator(sel).first().boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
// 1) open goblin cassetto
await click('[data-quest-poi-id="poi-goblin"]');
await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 8000 });
await page.waitForTimeout(600);
// 2) toggle a loadout item → packed state must flip (real session toggleItem)
const before = await page.evaluate(() => {
  const el = document.querySelector('[data-hudreal-cassetto] [data-testid^="cassetto-loadout-"]');
  return { id: el?.dataset.testid, packed: el?.dataset.packed };
});
await page.click(`[data-hudreal-cassetto] [data-testid="${before.id}"]`, { force: true });
await page.waitForTimeout(400);
const after = await page.evaluate((id) => document.querySelector(`[data-testid="${id}"]`)?.dataset.packed, before.id);
console.log('loadout toggle:', before.packed, '→', after);
// 3) ESC closes
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
console.log('closed after ESC:', (await page.locator('[data-hudreal-cassetto]').count()) === 0);
// 4) switch to rovine POI → different title/data
const rovine = await page.locator('[data-quest-poi-id="poi-rovine"]').count();
console.log('rovine poi present:', rovine);
if (rovine) {
  await click('[data-quest-poi-id="poi-rovine"]');
  await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 8000 });
  await page.waitForTimeout(600);
  const t = await page.evaluate(() => document.querySelector('[data-hudreal-cassetto]')?.textContent.slice(0, 400));
  console.log('rovine cassetto:', JSON.stringify(t?.slice(0, 200)));
  await page.screenshot({ path: 'test-results/cassetto-game-rovine.png' });
}
console.log('errors:', errors.length, errors.slice(0, 5));
await b.close();
