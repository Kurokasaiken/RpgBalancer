import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=roster&view=narrative', {waitUntil:'domcontentloaded', timeout:20000});
await page.waitForSelector('[data-testid="hudreal-roster-drape"]', {timeout:15000}).catch(()=>{});
await page.waitForTimeout(2500);
await page.screenshot({path:'test-results/roster-check.png'});
// zoom on bottom-left area where the "bandierina" is
await page.screenshot({path:'test-results/roster-check-bl.png', clip:{x:0,y:550,width:500,height:350}});
console.log('done');
await b.close();
