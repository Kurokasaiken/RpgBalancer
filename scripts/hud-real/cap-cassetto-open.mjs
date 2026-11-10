import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative', {waitUntil:'domcontentloaded', timeout:20000});
await page.waitForSelector('[data-hudslot="cassetto"]', {timeout:15000}).catch(()=>{});
await page.waitForTimeout(4000);
await page.screenshot({path:'test-results/cassetto-open.png'});
// crop the right column for the ChatGPT brief
await page.screenshot({path:'test-results/cassetto-open-right.png', clip:{x:1050,y:0,width:550,height:900}});
console.log('done'); await b.close();
