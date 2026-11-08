import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1650,height:1000}});
await page.goto('http://localhost:5173/mockups/plan113-comp/on-game.html',{waitUntil:'networkidle',timeout:15000});
await page.waitForTimeout(2000);
await page.screenshot({path:'test-results/ongame-preview.png', fullPage:false});
await b.close(); console.log('done');
