/* TEMP: capture scroll-band lab candidates, headless 2x. */
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1150, height: 560 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/mockups/scroll-band-lab/index.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: '.mw/runs/20261120-scroll-band/captures/fork-abc.png', fullPage: true });
const cands = page.locator('.cand');
for (let i = 0; i < 3; i++) {
  await cands.nth(i).screenshot({ path: `.mw/runs/20261120-scroll-band/captures/cand-${'ABC'[i]}.png` });
}
await browser.close();
console.log('done');
