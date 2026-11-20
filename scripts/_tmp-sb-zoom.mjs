import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1150, height: 560 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/mockups/scroll-band-lab/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const bands = page.locator('.band, .bandC');
for (let i = 0; i < 3; i++) {
  const b = bands.nth(i);
  const box = await b.boundingBox();
  await page.screenshot({ path: `.mw/runs/20261120-scroll-band/captures/zoom-${'ABC'[i]}.png`,
    clip: { x: box.x - 26, y: box.y - 4, width: 60, height: box.height + 8 } });
}
await browser.close();
console.log('done');
