import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/bezel-variants',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(3000);
await page.screenshot({path:'public/mockups/plan113-comp/kit/bezel-variants.png',fullPage:false});
console.log('done');
await b.close();
