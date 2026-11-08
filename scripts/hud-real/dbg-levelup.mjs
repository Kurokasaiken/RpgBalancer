import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('console', m => { if (m.type()==='error') console.log('ERR:', m.text().slice(0,300)); });
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,400)));
await page.goto('http://localhost:5173/hud-compose?comp=levelup&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(3000);
console.log('trigger count:', await page.locator('[data-testid="hudreal-levelup-trigger"]').count());
await b.close();
