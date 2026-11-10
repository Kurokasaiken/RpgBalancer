import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:1500}});
await page.goto('http://localhost:5173/mockups/plan113-comp/roster-triad.html',{waitUntil:'networkidle',timeout:20000});
await page.waitForTimeout(1200);
await page.screenshot({path:'test-results/roster-triad-page.png',fullPage:true});
console.log('done'); await b.close();
