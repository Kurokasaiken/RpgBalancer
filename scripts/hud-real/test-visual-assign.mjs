import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
await page.locator('[data-cassetto-debug="select-first"]').click();
await page.waitForTimeout(3000);
const w = page.locator('[data-hudreal-cassetto]');
const wbox = await w.boundingBox();
await page.screenshot({path:'test-results/cas-seat-check.png', clip: wbox ?? undefined});
// also check the seat DOM state — does a medal/portrait exist inside the cassetto slots?
const medals = await page.locator('[data-hudreal-cassetto] [data-resident-id], [data-hudreal-cassetto] img[class*=portrait], [data-hudreal-cassetto] .slot-v12__medal').count();
console.log('medals in cassetto:', medals);
await b.close(); console.log('done');
