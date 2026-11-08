import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('pageerror', e => console.log('PAGEERR', e.message?.slice(0,200)));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(5000);
const cards = page.locator('[data-resident-id]');
const n = await cards.count();
console.log('cards:', n);
for (let i = 0; i < Math.min(n, 5); i++) {
  const c = cards.nth(i);
  const id = await c.getAttribute('data-resident-id');
  const box = await c.boundingBox();
  if (!box) continue;
  await page.mouse.click(box.x + 20, box.y + 20);
  await page.waitForTimeout(1200);
  // after each click count seated slots (assigned medallions inside cassetto)
  const seated = await page.locator('[data-hudreal-cassetto] .slot-v12__medal, [data-hudreal-cassetto] [data-resident-id]').count();
  console.log(`${id} → seated after click: ${seated}`);
  if (seated > 0) { await page.screenshot({path:`test-results/assign-${id}.png`}); break; }
}
await b.close(); console.log('done');
