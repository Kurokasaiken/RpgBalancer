import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 40000 }).catch(() => {});
await page.waitForTimeout(4000);
// open the director menu via its hud trigger, then trigger 'legacy'
const trig = await page.locator('[data-testid="hud-director-trigger"]').count();
console.log('director trigger:', trig);
if (trig) {
  const tb = await page.locator('[data-testid="hud-director-trigger"]').first().boundingBox();
  await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await page.waitForTimeout(800);
  const dp = await page.locator('[data-testid="director-panel"]').count();
  console.log('director panel open:', dp);
  const btns = await page.evaluate(() => [...document.querySelectorAll('[data-testid="director-panel"] button')].map((b) => b.textContent.trim()).slice(0, 30));
  console.log('director actions:', JSON.stringify(btns));
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('[data-testid="director-panel"] button')].find((b) => /legacy|inherit/i.test(b.textContent ?? ''));
    if (btn) { btn.click(); return btn.textContent.trim(); }
    return null;
  });
  console.log('clicked action:', clicked);
}
await page.waitForTimeout(700);
const rel = await page.locator('[data-testid="hudreal-reliquary"]').count();
const stock = await page.locator('[data-testid="legacy-reliquary"]').count();
console.log('hudreal reliquary:', rel, '| stock:', stock);
const info = await page.evaluate(() => {
  const c = document.querySelector('[data-testid="hudreal-reliquary"]');
  return c ? [...c.querySelectorAll('span,button')].map((s) => s.textContent.trim()).filter(Boolean).slice(0, 20) : [];
});
console.log(JSON.stringify(info));
await page.screenshot({ path: 'test-results/reliquary-game.png' });
console.log('errors:', errors.length, errors.slice(0, 5));
await b.close();
