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
    if (text === 'Pattern') await btn.click();
  }
  await new Promise(r => setTimeout(r, 500));
  // zoom in
  const renderer = await page.$('[data-testid="world-surface-renderer"]');
  if (renderer) {
    const box = await renderer.boundingBox();
    await renderer.hover();
    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel({ deltaY: -100 });
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 500));
    // pan
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width/2 + 150, box.y + box.height/2 + 80, { steps: 10 });
    await page.mouse.up();
  }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-results/world-surface-sea-pattern-pan.png' });
  console.log('screenshot saved');
  await browser.close();
})();
