import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 20000 });
await page.waitForSelector('[data-hudreal-resources]', { timeout: 10000 }).catch(() => console.log('no resources el'));
await page.waitForTimeout(800);
const geo = await page.evaluate(() => {
  const res = document.querySelector('[data-cassetto-resources]');
  const bar = res?.querySelector('[data-hudreal-resources]');
  const well = res?.getBoundingClientRect();
  const barR = bar?.getBoundingClientRect();
  const frame = document.querySelector('[data-hudreal-cassetto] img')?.getBoundingClientRect();
  return { well, bar: barR, frame, fit: bar?.parentElement?.style.transform };
});
console.log(JSON.stringify(geo, null, 1));
await page.screenshot({ path: '/tmp/cass-res.png' });
await browser.close();
