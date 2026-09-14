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
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent?.trim());
    if (text === 'Pattern') {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  // Remove mask and wait
  await page.evaluate(() => {
    const c = document.querySelector('canvas[style*="sea_mask"]');
    if (c) {
      c.style.maskImage = 'none';
      c.style.webkitMaskImage = 'none';
    }
  });
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: 'test-results/world-surface-sea-pattern-no-mask.png' });

  // Also dump a small center pixel block for debugging
  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas[style*="sea_mask"]');
    return c ? { w: c.width, h: c.height, parent: c.parentElement?.style?.cssText?.slice(0, 100) } : null;
  });
  console.log(JSON.stringify(info));
  await browser.close();
})();
