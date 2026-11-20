/* TEMP: scrollbar witness v2 — wait for veil to clear, crop list inner edge. */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
// wait for the app to be interactive: the world canvas or HUD exists
await page.waitForSelector('canvas', { state: 'attached', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(6000);
await page.keyboard.press('r');
const panel = page.locator('[data-testid="resident-roster-panel"]');
await panel.waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(1200);

const list = panel.locator('[data-resident-count]');
await list.evaluate((el) => { el.scrollTop = 60; });
await page.waitForTimeout(400);
const lbox = await list.boundingBox();
console.log('list box:', JSON.stringify(lbox));
// crop: 34px at the inner right edge of the list = the scrollbar gutter
await page.screenshot({
  path: 'test-results/scroll-band/roster-gutter-v2.png',
  clip: { x: lbox.x + lbox.width - 34, y: lbox.y + 4, width: 34, height: Math.min(360, lbox.height - 8) },
});
await page.screenshot({ path: 'test-results/scroll-band/roster-panel-v2.png', clip: lbox });
await browser.close();
console.log('done');
