import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(3500);
await page.screenshot({path:'test-results/switcher-hud.png'});
/* click Cassetto chip → navigates */
await page.click('[data-switcher="cassetto"]');
await page.waitForTimeout(4500);
console.log('after click url:', page.url());
await page.screenshot({path:'test-results/switcher-cassetto.png'});
await b.close();
