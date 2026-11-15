import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.type() === 'error') console.log('[console-err]', m.text().slice(0, 250)); });
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded', timeout: 30000 });
for (let i = 1; i <= 60; i++) {
  await page.waitForTimeout(4000);
  const st = await page.evaluate(() => Boolean(window.__worldCam && window.__worldCamCtl)).catch(() => 'eval-failed');
  if (i % 5 === 0 || st === true || st === 'eval-failed') console.log(`t=${i * 4}s cam=${st}`);
  if (st === 'eval-failed') break;
  if (st === true) {
    await page.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 720, panY: 700 - 450, zoom: 1 }));
    await page.waitForTimeout(1000);
    const hit = page.locator('[data-testid="place-village-hit"]');
    await hit.click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/poi-luogo-fancards/fancards-1440x900.png' });
    const el = page.locator('[data-testid="place-fancards"]');
    if (await el.count()) {
      const box = await el.first().boundingBox();
      if (box) await page.screenshot({ path: 'test-results/poi-luogo-fancards/fancards-zoom-1440x900.png',
        clip: { x: Math.max(0, box.x - 60), y: Math.max(0, box.y - 60), width: Math.min(1440, box.width + 120), height: Math.min(900, box.height + 120) } });
    }
    console.log('done, fancards=', await el.count());
    break;
  }
}
await browser.close();
