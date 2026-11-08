import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => /quest|goblin|idle/i.test(k)));
console.log('save keys:', keys);
for (const k of keys.slice(0,6)) {
  const v = await page.evaluate((kk) => localStorage.getItem(kk)?.slice(0,300), k);
  console.log(k, '=>', v);
}
await b.close(); console.log('done');
