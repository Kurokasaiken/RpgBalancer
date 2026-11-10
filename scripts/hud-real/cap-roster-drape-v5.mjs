import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=roster&view=narrative', {waitUntil:'domcontentloaded', timeout:20000});
await page.waitForSelector('[data-testid="hudreal-roster-drape"]', {timeout:15000});
await page.waitForTimeout(2000);

// 1. Open view (single clean rings, no duplication)
await page.screenshot({path:'test-results/roster-drape-v5-open.png'});

// 2. Click to collapse/close
await page.locator('[data-testid="roster-drape-toggle"]').click();
await page.waitForTimeout(600);
await page.screenshot({path:'test-results/roster-drape-v5-closed.png'});

// 3. Click to re-open and scroll down
await page.locator('[data-testid="roster-drape-toggle"]').click();
await page.waitForTimeout(500);
await page.locator('[data-testid="roster-drape-scroll"]').evaluate(el => el.scrollTop = 500);
await page.waitForTimeout(500);
await page.screenshot({path:'test-results/roster-drape-v5-scrolled.png'});

console.log('done capturing v5');
await b.close();
