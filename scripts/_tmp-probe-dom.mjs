import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0,300)));
await page.goto('http://127.0.0.1:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(9000);
const info = await page.evaluate(() => ({
  text: document.body.innerText.slice(0,300),
  divs: document.querySelectorAll('div').length,
  canvas: document.querySelectorAll('canvas').length,
  sections: document.querySelectorAll('section').length,
  containers: document.querySelectorAll('[data-cassetto-vignette-frame]').length,
}));
console.log(JSON.stringify(info,null,1));
await browser.close();
