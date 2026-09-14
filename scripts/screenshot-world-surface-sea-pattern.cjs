const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:5173/world-surface';
  const out = process.argv[3] || path.resolve('test-results/world-surface-sea-pattern.png');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  // wait for world surface to load
  await page.waitForFunction(() => document.querySelector('[data-testid="world-surface-renderer"]') !== null);
  await new Promise(r => setTimeout(r, 2000));
  // click the Pattern button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent?.trim());
    if (text === 'Pattern') {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: out });
  console.log('screenshot saved to', out);
  await browser.close();
})();
