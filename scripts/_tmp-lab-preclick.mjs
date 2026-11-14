import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 120_000 });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 640, panY: 700 - 400, zoom: 1 }));
await page.waitForTimeout(800);
await page.screenshot({ path: 'test-results/poi-luogo-radial/1280x800-preclick.png' });
// zoom 0.6 to see village context
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 640/0.6, panY: 700 - 400/0.6, zoom: 0.6 }));
await page.waitForTimeout(800);
await page.screenshot({ path: 'test-results/poi-luogo-radial/1280x800-preclick-z06.png' });
await browser.close();
