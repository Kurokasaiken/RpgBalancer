import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4000);
await page.click('[data-cassetto-debug="select-first"]');
let a = '0';
for (let i = 0; i < 120 && a !== '1'; i++) {
  await page.waitForTimeout(250);
  a = await page.evaluate(() => document.querySelector('[data-detail-open]')?.getAttribute('data-assigned') ?? '?');
}
console.log('assigned after ~', 'polls done, value =', a);
await page.waitForTimeout(600);
await page.screenshot({path:'test-results/cassetto-assigned.png'});
await b.close();
