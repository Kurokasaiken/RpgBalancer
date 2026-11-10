import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=reliquary&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForSelector('[data-testid="hudreal-reliquary"]',{timeout:25000}).catch(()=>{});
await page.waitForTimeout(2000);
await page.screenshot({path:'test-results/f3-reliquary.png'});
console.log('done');
await b.close();
