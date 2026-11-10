import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=roster&view=narrative', {waitUntil:'domcontentloaded', timeout:20000});
await page.waitForSelector('[data-testid="hudreal-roster-drape"]', {timeout:15000});
await page.waitForTimeout(2500);
await page.screenshot({path:'test-results/roster-drape-v4.png'});

// scroll down inside the laurel strand
await page.locator('[data-testid="roster-drape-scroll"]').evaluate(el => el.scrollTop = 320);
await page.waitForTimeout(800);
await page.screenshot({path:'test-results/roster-drape-v4-scrolled.png'});

console.log('done capturing v4');
await b.close();
