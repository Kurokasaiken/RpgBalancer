import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('console', m => console.log('CON:', m.text().slice(0,220)));
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,300)));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4000);
const info = await page.evaluate(() => ({
  slotButtons: Array.from(document.querySelectorAll('[data-testid^="slot-button-"]')).map(e=>e.getAttribute('data-testid')),
  slotIds: Array.from(document.querySelectorAll('[data-slot-id]')).map(e=>e.getAttribute('data-slot-id')),
  residentCards: document.querySelectorAll('[data-resident-id]').length,
  rack: !!document.querySelector('[data-testid="resident-slot-rack"]'),
}));
console.log(JSON.stringify(info, null, 1));
await page.click('[data-cassetto-debug="select-first"]').catch(e=>console.log('dbg click fail', String(e).slice(0,120)));
await page.waitForTimeout(1500);
const after = await page.evaluate(() => ({
  flying: !!document.querySelector('[data-testid="flight-proxy"]'),
  host: document.querySelector('[data-detail-open]')?.getAttribute('data-assigned'),
}));
console.log(JSON.stringify(after));
await page.screenshot({path:'test-results/cassetto-dbg.png'});
await b.close();
