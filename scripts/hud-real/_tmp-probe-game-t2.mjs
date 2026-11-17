/* T2 witness on /game: cassetto aperto → blocchi + fold chip → collapse →
 *  edge chip → restore. Stesso componente del lab, montato su /game. */
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
const ready = () => page.waitForFunction(() => document.querySelectorAll('canvas').length > 0
  && typeof window.__idleVillageTestHooks?.expedition?.['poi-goblin']?.openDetail === 'function'
  && document.querySelectorAll('[data-testid="game-boot-screen"]').length === 0, null, { timeout: 200000, polling: 1000 });
await ready();
await page.waitForTimeout(800);
for (let a = 0; a < 3; a++) {
  try {
    await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
    await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 10000 });
    break;
  } catch (e) { console.log('openDetail retry', a, String(e).slice(0, 60)); await ready(); }
}
await page.waitForTimeout(900);
const expanded = await page.evaluate(() => ({
  drawer: !!document.querySelector('[data-testid="expedition-drawer"]'),
  blocks: [...document.querySelectorAll('[data-block]')].map((el) => el.getAttribute('data-block')),
  foldChip: !!document.querySelector('[data-testid="expedition-drawer-collapse"]'),
}));
console.log('EXPANDED:', JSON.stringify(expanded));
await page.screenshot({ path: 'test-results/hud-real/t2-game-expanded.png' });
await page.evaluate(() => document.querySelector('[data-testid="expedition-drawer-collapse"]')?.click());
await page.waitForTimeout(500);
const folded = await page.evaluate(() => ({
  cassetto: !!document.querySelector('[data-hudreal-cassetto]'),
  expandChip: !!document.querySelector('[data-testid="expedition-drawer-expand"]'),
}));
console.log('FOLDED:', JSON.stringify(folded));
await page.screenshot({ path: 'test-results/hud-real/t2-game-folded.png' });
await page.evaluate(() => document.querySelector('[data-testid="expedition-drawer-expand"]')?.click());
await page.waitForTimeout(500);
const restored = await page.evaluate(() => ({
  cassetto: !!document.querySelector('[data-hudreal-cassetto]'),
  slots: document.querySelectorAll('[data-testid^="slot-button-"]').length,
}));
console.log('RESTORED:', JSON.stringify(restored));
await page.screenshot({ path: 'test-results/hud-real/t2-game-restored.png' });
console.log('errors:', errors.length, errors.slice(0, 3));
await b.close();
