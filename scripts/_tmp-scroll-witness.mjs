/* TEMP: scrollbar witness on roster — opens roster via `r` shortcut, forces
 * overflow (maxHeight shrink), captures scrollbar gutter at panel scale. */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/game', { waitUntil: 'networkidle', timeout: 90000 });
await page.keyboard.press('r');
const panel = page.locator('[data-testid="resident-roster-panel"]');
await panel.waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(1500);

const list = panel.locator('[data-resident-count]');
const facts = await list.evaluate((el) => {
  el.scrollTop = 40;
  const cs = getComputedStyle(el);
  return {
    hudScroll: el.hasAttribute('data-hud-scroll'),
    scrollbarColor: cs.scrollbarColor,
    scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
    scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
  };
});
console.log('facts:', JSON.stringify(facts));
// crop right edge where the scrollbar gutter sits
const box = await panel.boundingBox();
await page.screenshot({ path: 'test-results/scroll-band/roster-panel.png' });
await page.screenshot({
  path: 'test-results/scroll-band/roster-scrollbar-gutter.png',
  clip: { x: box.x + box.width - 60, y: box.y + 60, width: 60, height: Math.min(400, box.height - 80) },
});
await browser.close();
console.log('done');
