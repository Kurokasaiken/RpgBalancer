import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4000);
const cas = page.locator('[data-hudreal-cassetto]');
const box = await cas.locator('text=Party 1').first().boundingBox();
const cx = box.x + box.width/2, cy = box.y - 24;
// assign: click
await page.mouse.click(cx, cy); await page.waitForTimeout(800);
console.log('assigned — now press-and-hold 1.2s on same slot');
// extract: press and hold
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.waitForTimeout(1200);
await page.mouse.up();
await page.waitForTimeout(700);
await page.screenshot({path:'test-results/cassetto-after-hold.png'});
console.log('done');
await b.close();
