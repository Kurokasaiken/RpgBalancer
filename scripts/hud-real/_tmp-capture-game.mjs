import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/game',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('canvas',{timeout:40000}).catch(()=>{});
await page.waitForTimeout(15000);
await page.screenshot({path:'/Users/faustoboni/progetti_personali/mind-weaver/.mw/runs/20261110-chatgpt-ghiera/game-full.png',fullPage:false});
console.log('done');
await b.close();
