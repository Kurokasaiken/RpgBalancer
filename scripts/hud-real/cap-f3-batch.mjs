import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
const shots = [['reliquary','comp=reliquary&view=narrative'],['memorial','comp=memorial&seed=memorial&view=narrative'],['lost','comp=lost&view=narrative']];
for (const [name,q] of shots) {
  await page.goto(`http://localhost:5173/hud-compose?${q}`,{waitUntil:'networkidle',timeout:30000});
  await page.waitForSelector(`[data-testid="hudreal-${name==='lost'?'lost-layer':name}"]`,{timeout:25000}).catch(()=>{});
  await page.waitForTimeout(2000);
  await page.screenshot({path:`test-results/f3-${name}.png`});
  console.log(name,'done');
}
await page.goto('http://localhost:5173/hud-compose?comp=levelup&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForSelector('[data-testid="hudreal-levelup-trigger"]',{timeout:25000}).catch(()=>{});
await page.click('[data-testid="hudreal-levelup-trigger"]').catch(()=>{});
await page.waitForTimeout(2500);
await page.screenshot({path:'test-results/f3-levelup.png'});
console.log('levelup done');
await b.close();
