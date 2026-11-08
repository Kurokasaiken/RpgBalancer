import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('pageerror', e => console.log('PAGEERR', e.message?.slice(0,300)));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
const cas = page.locator('[data-hudreal-cassetto]');
console.log('cassetto:', await cas.count());
// 1) click a real roster card → medal flight → seat
const card = page.locator('[data-resident-id]').first();
const cardBox = await card.boundingBox();
console.log('roster card found:', !!cardBox, await card.getAttribute('data-resident-id'));
if (cardBox) { await page.mouse.click(cardBox.x + 20, cardBox.y + 20); await page.waitForTimeout(1400); }
await page.screenshot({path:'test-results/real-assign.png'});
// 2) press-hold on the seated slot → real clearSlot
const leader = await cas.locator('text=Expedition leader').first().boundingBox();
if (leader) {
  await page.mouse.move(leader.x + 10, leader.y - 40); await page.mouse.down();
  await page.waitForTimeout(1400); await page.mouse.up(); await page.waitForTimeout(800);
}
await page.screenshot({path:'test-results/real-extract.png'});
console.log('done');
await b.close();
