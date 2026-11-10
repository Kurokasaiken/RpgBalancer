import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1500,height:1000}});
await page.goto('http://localhost:5173/quest-editor', {waitUntil:'domcontentloaded', timeout:20000});
await page.waitForTimeout(4000);
await page.screenshot({path:'test-results/qe-dice-0.png'});
// click the 🎲 button on an option (skill check)
const dice = page.locator('button', {hasText: '🎲'});
console.log('dice buttons:', await dice.count());
if (await dice.count()) { await dice.first().click(); await page.waitForTimeout(1500); }
await page.screenshot({path:'test-results/qe-dice-rolled.png'});
console.log('done');
await b.close();
