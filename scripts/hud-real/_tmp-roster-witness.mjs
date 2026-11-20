/** TEMP: manifest-mode roster witness — opens the roster via the `r` HUD
 *  shortcut on the probe server, verifies the manifest-driven frame is in
 *  the DOM (data-frame-manifest + slicekit asset URLs), saves a PNG. */
import { chromium } from 'playwright';

const URL = process.env.PROBE_URL || 'http://localhost:5174/';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.keyboard.press('r');
const panel = page.locator('[data-testid="resident-roster-panel"]');
await panel.waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(1200);
const frame = panel.locator('[data-panel-frame="ornate"]');
const facts = await frame.evaluate((el) => ({
  variant: el.getAttribute('data-frame-variant'),
  manifest: el.getAttribute('data-frame-manifest'),
  pieceCount: el.querySelectorAll('img').length,
  edgeCount: el.querySelectorAll('div[style*="repeat"]').length,
  assetSample: el.querySelector('img')?.getAttribute('src'),
}));
console.log('frame facts:', JSON.stringify(facts));
await panel.screenshot({ path: 'test-results/slicekit/roster-manifest-frame.png' });
await page.screenshot({ path: 'test-results/slicekit/roster-manifest-full.png' });
await browser.close();
console.log('screenshots saved');
