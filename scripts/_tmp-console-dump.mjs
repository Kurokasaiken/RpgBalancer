import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => console.log(`[${m.type()}]`, m.text().slice(0, 300)));
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 400)));
page.on('requestfailed', (r) => console.log('[reqfail]', r.url().slice(-80), r.failure()?.errorText));
await page.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(25000);
const st = await page.evaluate(() => ({
  cam: Boolean(window.__worldCam),
  body: document.body.innerText.slice(0, 300),
  els: document.querySelectorAll('canvas, [data-testid]').length,
}));
console.log(JSON.stringify(st));
await browser.close();
