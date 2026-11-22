import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0,300)));
page.on('requestfailed', r => console.log('[reqfail]', r.url().slice(0,120), r.failure()?.errorText));
await page.goto('http://127.0.0.1:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 30_000 });
for (let i=0;i<6;i++){
  await page.waitForTimeout(3000);
  const n = await page.evaluate(() => document.querySelectorAll('div,section,canvas,img').length);
  console.log('t',(i+1)*3,'nodes',n);
  if (n>5) break;
}
const info = await page.evaluate(() => ({
  root: document.getElementById('root')?.children.length,
  text: document.body.innerText.slice(0,120),
}));
console.log(JSON.stringify(info));
await browser.close();
