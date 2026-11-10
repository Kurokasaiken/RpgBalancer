import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=astrolabe&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForSelector('[data-testid="hudreal-astrolabe"]',{timeout:30000});
await page.waitForTimeout(6000);
await page.screenshot({path:'test-results/astro-zanara.png', clip:{x:760,y:130,width:460,height:600}});
console.log('done');
await b.close();
