import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=reliquary&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForSelector('[data-testid="hudreal-reliquary"]',{timeout:25000});
await page.waitForTimeout(1500);
const items = await page.locator('[data-testid="hudreal-reliquary"]').getByText('ITEMS', {exact:true}).all();
console.log('ITEMS text nodes:', items.length);
for (const el of items) {
  const r = await el.boundingBox();
  console.log('  at', JSON.stringify(r));
}
await b.close();
