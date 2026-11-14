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
await click('[data-quest-poi-id="poi-goblin"]');
await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 8000 });
await page.waitForTimeout(700);
const src = await page.locator('[data-resident-id="hero-giggiolillo"]').first().boundingBox();
const dst = await page.locator('[data-testid="slot-button-poi-goblin:goblin-slot-leader"]').first().boundingBox();
console.log('drag', JSON.stringify(src), '→', JSON.stringify(dst));
// real pointer drag (dnd-kit PointerSensor: activate after movement threshold)
await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
await page.mouse.down();
await page.mouse.move(src.x + src.width / 2 + 12, src.y + src.height / 2 + 4, { steps: 4 });
await page.waitForTimeout(150);
const midX = (src.x + dst.x) / 2, midY = (src.y + dst.y) / 2;
await page.mouse.move(midX, midY, { steps: 20 });
await page.waitForTimeout(120);
await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 20 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'test-results/cassetto-drag-hover.png' });
await page.mouse.up();
await page.waitForTimeout(1200); // flight animation commit
const res = await page.evaluate(() => {
  const slot = document.querySelector('[data-testid="slot-button-poi-goblin:goblin-slot-leader"]');
  const rack = document.querySelector('[data-hudreal-cassetto] [data-testid="resident-slot-rack"]');
  return {
    slotOccupied: slot?.dataset.occupied ?? slot?.getAttribute('aria-label') ?? null,
    rackHtml: rack ? rack.querySelector('[data-slot-id="poi-goblin:goblin-slot-leader"]')?.outerHTML.slice(0, 400) : 'no rack',
    suppressed: document.querySelector('[data-resident-id="hero-giggiolillo"]')?.dataset.suppressed ?? null,
  };
});
console.log(JSON.stringify(res, null, 1));
await page.screenshot({ path: 'test-results/cassetto-drag-done.png' });
console.log('errors:', errors.length, errors.slice(0, 5));
await b.close();
