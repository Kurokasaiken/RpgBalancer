import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=reliquary&view=narrative',{waitUntil:'networkidle',timeout:30000});
await page.waitForSelector('[data-testid="hudreal-reliquary"]',{timeout:25000});
await page.waitForTimeout(1500);
const found = await page.locator('[data-testid="hudreal-reliquary"]').evaluateAll?.call;
const items = await page.locator('[data-testid="hudreal-reliquary"] *').filter({hasText:/items/i}).all();
console.log('elements matching /items/i:', items.length);
for (const el of items.slice(0,12)) {
  const r = await el.boundingBox();
  const txt = (await el.textContent()).trim().slice(0,20);
  const tag = await el.evaluate(e => e.tagName);
  console.log(`  ${tag} "${txt}" at`, JSON.stringify(r));
}
await b.close();
