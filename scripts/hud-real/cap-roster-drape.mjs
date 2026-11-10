import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=roster&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForSelector('[data-testid="hudreal-roster-drape"]',{timeout:25000}).catch(()=>{});
await page.waitForTimeout(2000);
await page.screenshot({path:'test-results/roster-drape.png'});
// scroll the column down to prove it scrolls
await page.locator('[data-testid="roster-drape-scroll"]').evaluate(e => e.scrollTop = 300);
await page.waitForTimeout(400);
await page.screenshot({path:'test-results/roster-drape-scrolled.png'});
console.log('done'); await b.close();
