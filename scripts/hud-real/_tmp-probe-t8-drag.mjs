import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1024, height: 800 } });
await page.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForSelector('[data-testid="expedition-sheet"]', { timeout: 30000 });
await page.waitForTimeout(900);
await page.click('[data-testid="expedition-sheet-toggle"]').catch(() => {});
await page.waitForTimeout(500);
const grab = async () => await page.locator('[data-testid="expedition-sheet-handle"]').boundingBox();
let box = await grab();
let cx = box.x + 20, cy = box.y + box.height / 2;
await page.mouse.move(cx, cy); await page.mouse.down();
for (let i = 1; i <= 10; i++) await page.mouse.move(cx, cy - i * 40);
await page.mouse.up(); await page.waitForTimeout(400);
console.log('AFTER-UP:', await page.evaluate(() => ({
  detent: document.querySelector('[data-testid="expedition-sheet"]')?.getAttribute('data-detent'),
  h: Math.round(document.querySelector('[data-testid="expedition-sheet"]')?.getBoundingClientRect().height ?? -1),
})));
await page.screenshot({ path: 'test-results/r339-t8-sheet-full-lab-1024.png' }).catch(() => {});
box = await grab(); // re-measure: at full the strip is near the top
cx = box.x + 20; cy = box.y + box.height / 2;
await page.mouse.move(cx, cy); await page.mouse.down();
for (let i = 1; i <= 10; i++) await page.mouse.move(cx, cy + i * 45);
await page.mouse.up(); await page.waitForTimeout(400);
console.log('AFTER-DOWN:', await page.evaluate(() => ({
  detent: document.querySelector('[data-testid="expedition-sheet"]')?.getAttribute('data-detent'),
  h: Math.round(document.querySelector('[data-testid="expedition-sheet"]')?.getBoundingClientRect().height ?? -1),
})));
await page.screenshot({ path: 'test-results/r339-t8-sheet-backpeek-lab-1024.png' }).catch(() => {});
await b.close();
