import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 2 });
await page.goto('file:///tmp/sb-min.html');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/scroll-band/min-repro.png', clip: { x: 0, y: 0, width: 220, height: 220 } });
await browser.close();
console.log('done');
