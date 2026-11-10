import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,500)));
page.on('console', m => { if (m.type()==='error') console.log('ERR:', m.text().slice(0,300)); });
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(5000);
console.log('cassetto el:', await page.locator('[data-hudreal-cassetto]').count());
await b.close();
