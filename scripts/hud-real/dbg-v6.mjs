import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('console', m => { const t=m.type(); if(t==='error'||t==='warning'&&m.text().includes('React')) console.log('C-'+t.toUpperCase().slice(0,3)+':', m.text().slice(0,500)); });
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,600)));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(8000);
console.log('hudslots:', await page.locator('[data-hudslot]').count(), '| cassetto:', await page.locator('[data-hudreal-cassetto]').count());
await b.close();
