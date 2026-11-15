/* Element-screenshot of place-fancards for exact mockup overlay. */
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
page.on('console', m => { if (m.type()==='error') console.log('[console]', m.text().slice(0,160)); });
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__worldCam && window.__worldCamCtl), undefined, { timeout: 270_000 });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 800, panY: 700 - 500, zoom: 1 }));
await page.waitForTimeout(900);
await page.evaluate(() => document.querySelector('[data-testid="place-village-hit"]').click());
await page.waitForTimeout(800);
const bb = await page.locator('[data-testid="place-fancards"]').first().boundingBox();
console.log('bbox', JSON.stringify(bb));
await page.screenshot({ path: 'test-results/poi-luogo-fancards/fancards-element.png', clip: bb });
console.log('done');
await browser.close();
