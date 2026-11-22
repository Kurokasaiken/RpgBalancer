import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => console.log('[console]', m.type(), m.text().slice(0,180)));
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0,300)));
await page.goto('http://127.0.0.1:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(6000);
const info = await page.evaluate(() => {
  const imgs=[...document.images].map(i=>({s:i.src.split('/').pop(),x:Math.round(i.getBoundingClientRect().x),w:Math.round(i.getBoundingClientRect().width)}));
  return { imgs: imgs.slice(0,12), err: document.querySelector('vite-error-overlay')?.shadowRoot?.textContent?.slice(0,200) ?? null };
});
console.log(JSON.stringify(info,null,1));
await browser.close();
