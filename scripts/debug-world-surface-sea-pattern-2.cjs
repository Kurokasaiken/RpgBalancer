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
  const info = await page.evaluate(() => {
    const ourCanvas = document.querySelector('canvas[style*="sea_mask"]');
    const ourWrap = document.querySelector('div[style*="overflow: hidden"][style*="z-index: 50"]');
    const ourPanel = document.querySelector('div[class*="bg-slate-900"]');
    const bodyChildren = document.body.innerHTML.length;
    return {
      ourCanvas: ourCanvas ? { exists: true, width: ourCanvas.width, height: ourCanvas.height, parent: ourCanvas.parentElement?.tagName } : null,
      ourWrap: ourWrap ? { tag: ourWrap.tagName, html: ourWrap.outerHTML.slice(0, 200) } : null,
      ourPanel: ourPanel ? { exists: true, text: ourPanel.textContent?.slice(0, 100) } : null,
      bodyChildren,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
