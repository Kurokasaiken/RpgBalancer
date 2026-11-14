import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 150_000 });
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 640 / 1.4, panY: 700 - 400 / 1.4, zoom: 1.4 }));
await page.waitForTimeout(4000);
const vs = await page.evaluate(() => {
  const cam = window.__worldCam;
  return { x: (1515 - cam.panX) * cam.zoom, y: (700 - cam.panY) * cam.zoom };
});
await page.mouse.move(vs.x, vs.y);
await page.waitForTimeout(600);
await page.screenshot({ path: 'test-results/poi-luogo-radial/v4-hover.png' });
await browser.close();
console.log('DONE');
