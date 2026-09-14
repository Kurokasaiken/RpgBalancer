const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://127.0.0.1:5173/world-surface';
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('[data-testid="world-surface-renderer"]') !== null);
  await new Promise(r => setTimeout(r, 2000));
  // Click pattern to show effect and panel
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent?.trim());
    if (text === 'Pattern') await btn.click();
  }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-results/world-surface-normal.png' });
  // Click UI hide
  const buttons2 = await page.$$('button');
  for (const btn of buttons2) {
    const text = await btn.evaluate((el) => el.textContent?.trim());
    if (text === 'Hide UI' || text === 'Nascondi UI') await btn.click();
  }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-results/world-surface-clean.png' });
  console.log('screenshots saved');
  await browser.close();
})();
