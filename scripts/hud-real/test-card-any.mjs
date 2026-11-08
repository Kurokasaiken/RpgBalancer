import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('console', m => { if (m.text().includes('cassetto-host')) console.log('LOG', m.text().slice(0,250)); });
page.on('pageerror', e => console.log('PAGEERR', e.message?.slice(0,200)));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
const cards = page.locator('[data-resident-id]');
console.log('cards:', await cards.count());
const ids = await page.evaluate(() => Array.from(document.querySelectorAll('[data-resident-id]'), e=>e.getAttribute('data-resident-id')));
console.log('ids:', ids.slice(0,8));
for (let i = 0; i < Math.min(ids.length, 4); i++) {
  const box = await cards.nth(i).boundingBox();
  if (!box) continue;
  await page.mouse.click(box.x + 20, box.y + 20);
  await page.waitForTimeout(1400);
  console.log(`click ${ids[i]} → assigned:`, await page.locator('[data-assigned]').getAttribute('data-assigned'));
}
await b.close(); console.log('done');
