import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,300)));
await page.goto('http://localhost:5173/hud-compose?comp=astrolabe&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(6000);
await page.screenshot({path:'test-results/signed-astrolabe.png'});
console.log('done');
await b.close();
