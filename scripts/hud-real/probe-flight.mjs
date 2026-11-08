import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
await page.locator('[data-cassetto-debug="select-first"]').click();
// probe during the flight window (~50ms delay + anim)
await page.waitForTimeout(300);
const flying = await page.evaluate(() => {
  const els = document.querySelectorAll('[class*=flight], [class*=Flight], [data-flight], [class*=proxy], [class*=Proxy]');
  return { count: els.length, html: Array.from(els).slice(0,2).map(e => e.outerHTML.slice(0,150)) };
});
console.log('flight els mid-flight:', JSON.stringify(flying));
await page.waitForTimeout(2500);
// assignment state via draft + slot DOM change
const seated = await page.evaluate(() => {
  const slot = document.querySelector('[data-slot-id="poi-goblin:goblin-slot-leader"]');
  return slot ? slot.innerHTML.slice(0, 400) : 'no slot';
});
console.log('leader slot html:', seated.slice(0, 350));
await b.close(); console.log('done');
