const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:9000/';
  const out = process.argv[3] || path.resolve('test-results/sea-spike-screenshot.png');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.getElementById('fps')?.textContent.includes('fps'));
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    if (window.__debugState) {
      window.__debugState.magnification = 2;
    }
    if (typeof window.__layoutStage === 'function') {
      window.__layoutStage();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: out });
  console.log('screenshot saved to', out);
  await browser.close();
})();
