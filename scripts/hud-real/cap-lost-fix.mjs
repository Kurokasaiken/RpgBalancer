import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=lost&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(3500);
await page.screenshot({path:'test-results/signed-lost.png'});
await b.close(); console.log('done');
