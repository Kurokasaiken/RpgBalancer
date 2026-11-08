import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('console', m => { if (m.type()==='error'||m.type()==='warning') console.log('PAGE', m.type(), m.text().slice(0,200)); });
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4000);
const cas = page.locator('[data-hudreal-cassetto]');
console.log('cassetto found:', await cas.count());
// find the first slot element inside the rack
const slots = cas.locator('[data-slot-id], [data-resident-slot], .slot-v12__root, [role="button"]');
console.log('slot-ish elements:', await slots.count());
// try clicking the center of the first party slot
const box = await cas.locator('text=Party 1').first().boundingBox();
console.log('Party1 box:', JSON.stringify(box));
if (box) {
  await page.mouse.click(box.x + box.width/2, box.y - 24);
  await page.waitForTimeout(900);
  await page.screenshot({path:'test-results/cassetto-after-click.png'});
  // count assigned medallions
  const medals = await cas.locator('[data-resident-id], .slot-v12__medal, img').count();
  console.log('medal-ish after click:', medals);
}
await b.close();
console.log('done');
