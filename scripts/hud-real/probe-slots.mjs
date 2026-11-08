import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
const attrs = await page.evaluate(() => {
  const els = document.querySelectorAll('[data-hudreal-cassetto] [data-slot-id], [data-hudreal-cassetto] [data-slot-component], [data-hudreal-cassetto] [data-seat]');
  return Array.from(els, el => Array.from(el.attributes).map(a => `${a.name}=${a.value}`).join(' ')).slice(0,10);
});
console.log('slot attrs:', attrs);
console.log('all data-slot-id els:', await page.locator('[data-slot-id]').count());
const ids = await page.evaluate(() => Array.from(document.querySelectorAll('[data-slot-id]'), el => el.getAttribute('data-slot-id')));
console.log('slot ids:', ids);
await b.close(); console.log('done');
