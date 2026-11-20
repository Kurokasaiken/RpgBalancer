/* TEMP v4 — (a) wheel scrollTop step-test; (b) force classic scrollbar via
 * ::-webkit-scrollbar path (scrollbar-width/color -> auto) to SEE the themed
 * band, which is what classic-scrollbar environments paint. */
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

// (a) wheel step test — disable smooth scroll so the delta is immediate
await list.evaluate((el) => { el.style.scrollBehavior = 'auto'; el.scrollTop = 0; });
await page.mouse.move(lbox.x + lbox.width / 2, lbox.y + lbox.height / 2);
await page.mouse.wheel(0, 150);
await page.waitForTimeout(300);
const afterDown = await list.evaluate((el) => el.scrollTop);
await page.mouse.wheel(0, -80);
await page.waitForTimeout(300);
const afterUp = await list.evaluate((el) => el.scrollTop);
console.log('wheel test: down150 ->', afterDown, '| up80 ->', afterUp);

// (b) force classic painted scrollbar (webkit path) — what non-overlay envs show
await page.addStyleTag({ content: `
  .skin-scope [data-hud-scroll] { scrollbar-width: auto !important; scrollbar-color: auto !important; }
`});
await list.evaluate((el) => { el.scrollTop = 40; });
await page.waitForTimeout(200);
await page.screenshot({
  path: 'test-results/scroll-band/roster-gutter-classic.png',
  clip: { x: lbox.x + lbox.width - 30, y: lbox.y, width: 30, height: Math.min(360, lbox.height) },
});
await browser.close();
console.log('done');
