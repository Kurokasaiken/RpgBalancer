import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4000);
await page.click('[data-cassetto-debug="select-first"]');
let last = '';
for (let i = 0; i < 50; i++) {
  const s = await page.evaluate(() => ({
    fp: document.querySelectorAll('[data-testid="flight-proxy"]').length,
    assigned: document.querySelector('[data-detail-open]')?.getAttribute('data-assigned'),
  }));
  const j = JSON.stringify(s);
  if (j !== last) { console.log(`t+${i*100}ms`, j); last = j; }
  await page.waitForTimeout(100);
}
await b.close();
