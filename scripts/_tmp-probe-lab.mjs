import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}]`, m.text().slice(0, 200)); });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 14; i++) {
  await page.waitForTimeout(5000);
  const state = await page.evaluate(() => ({
    cam: Boolean(window.__worldCam), ctl: Boolean(window.__worldCamCtl),
    marker: document.querySelectorAll('[data-testid="map-place"]').length,
    canvases: document.querySelectorAll('canvas').length,
  }));
  console.log(`t=${(i + 1) * 5}s`, JSON.stringify(state));
  if (state.cam) break;
}
await browser.close();
