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
    const canvases = document.querySelectorAll('canvas');
    const overlay = document.querySelector('div[style*="pointer-events: none"][style*="z-index: 50"]');
    const panel = document.querySelector('div[style*="z-index: 60"]');
    const buttons = Array.from(document.querySelectorAll('button')).map((b) => b.textContent?.trim());
    return {
      canvasCount: canvases.length,
      canvasSizes: Array.from(canvases).map((c) => ({ w: c.width, h: c.height, sw: c.style.width, sh: c.style.height, z: c.style.zIndex })),
      overlayHtml: overlay ? overlay.outerHTML.slice(0, 200) : null,
      panelHtml: panel ? panel.outerHTML.slice(0, 200) : null,
      buttons,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
