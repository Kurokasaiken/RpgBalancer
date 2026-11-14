/* _tmp-village-crop.mjs — crop pulito del villaggio dalla superficie Pixi reale. */
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173/mappa2-lab', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 90_000 });
await page.waitForTimeout(2500);
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 1440 / 2, panY: 700 - 900 / 2, zoom: 1 }));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'test-results/poi-luogo-lab/village-clean.png' });
await browser.close();
console.log('done');
