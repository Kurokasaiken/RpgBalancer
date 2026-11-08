import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,300)));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4000);
await page.click('[data-cassetto-debug="select-first"]');
for (let i = 0; i < 16; i++) {
  const s = await page.evaluate(() => ({
    fp: document.querySelectorAll('[data-testid="flight-proxy"]').length,
    assigned: document.querySelector('[data-detail-open]')?.getAttribute('data-assigned'),
    medals: document.querySelectorAll('[data-testid^="slot-medal-"]').length,
  }));
  console.log(`t+${i*80}ms`, JSON.stringify(s));
  await page.waitForTimeout(80);
}
await b.close();
