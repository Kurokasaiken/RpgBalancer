import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1500,height:1400}});
await page.goto('http://localhost:5173/bezel-variants',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('[data-testid="bezel-row-zanara2"]',{timeout:30000});
await page.waitForTimeout(4000);
await page.screenshot({path:'/Users/faustoboni/progetti_personali/mind-weaver/.mw/runs/20261110-chatgpt-ghiera/gen/bezel-page-top.png',clip:{x:0,y:0,width:1400,height:700}});
console.log('done');
await b.close();
