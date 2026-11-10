import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForSelector('[data-hudreal-cassetto]',{timeout:20000});
await page.waitForTimeout(2000);
await page.screenshot({path:'test-results/cassetto-v3-crop.png', clip:{x:1140,y:40,width:460,height:820}});
console.log('done');
await b.close();
