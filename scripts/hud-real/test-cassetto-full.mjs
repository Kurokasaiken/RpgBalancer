import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('pageerror', e => console.log('PAGEERR', e.message?.slice(0,200)));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4000);
const cas = page.locator('[data-hudreal-cassetto]');
console.log('cassetto:', await cas.count());
// 1) CONFIRM state before assignment (should be disabled-ish)
const confirm = cas.locator('button').filter({hasText:/confirm/i}).first();
console.log('confirm disabled?', await confirm.getAttribute('disabled'));
// 2) click first slot → assign via session
const leader = await cas.locator('text=Expedition leader').first().boundingBox();
if (leader) { await page.mouse.click(leader.x + 10, leader.y - 22); await page.waitForTimeout(900); }
await page.screenshot({path:'test-results/cas-assign.png'});
// count occupied medallions (assigned seats show portraits)
// 3) loadout tile click → pack
const car = await cas.locator('text=CARICO').first().boundingBox();
if (car) { await page.mouse.click(car.x + 30, car.y + 36); await page.waitForTimeout(600); }
await page.screenshot({path:'test-results/cas-pack.png'});
// 4) hold on the occupied slot → extract
if (leader) {
  await page.mouse.move(leader.x + 10, leader.y - 22); await page.mouse.down();
  await page.waitForTimeout(1300); await page.mouse.up(); await page.waitForTimeout(800);
}
await page.screenshot({path:'test-results/cas-extract.png'});
console.log('done');
await b.close();
