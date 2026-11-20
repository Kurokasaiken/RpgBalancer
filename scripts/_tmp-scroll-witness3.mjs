/* TEMP v3 — capture DURING scroll (overlay thumb flashes), then measure
 * painted pixels in the gutter to see what Chromium actually drew. */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('canvas', { state: 'attached', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(6000);
await page.keyboard.press('r');
const panel = page.locator('[data-testid="resident-roster-panel"]');
await panel.waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(1200);

const list = panel.locator('[data-resident-count]');
const lbox = await list.boundingBox();
// scroll via real wheel over the list — triggers overlay scrollbar
await page.mouse.move(lbox.x + lbox.width / 2, lbox.y + lbox.height / 2);
await page.mouse.wheel(0, 240);
await page.screenshot({
  path: 'test-results/scroll-band/roster-gutter-live.png',
  clip: { x: lbox.x + lbox.width - 30, y: lbox.y, width: 30, height: Math.min(360, lbox.height) },
});
await page.mouse.wheel(0, -120);
await page.screenshot({
  path: 'test-results/scroll-band/roster-gutter-live2.png',
  clip: { x: lbox.x + lbox.width - 30, y: lbox.y, width: 30, height: Math.min(360, lbox.height) },
});
// what does chromium say about the bar? check layout gutter width
const metrics = await list.evaluate((el) => ({
  innerW: el.clientWidth, outerW: el.getBoundingClientRect().width,
  scrollTop: el.scrollTop,
}));
console.log('metrics:', JSON.stringify(metrics));
await browser.close();
console.log('done');
