import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
console.log('slot-button els:', await page.locator('[data-testid^="slot-button-"]').count());
const ids = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid^="slot-button-"]'), el => el.getAttribute('data-testid')));
console.log('testids:', ids);
await b.close(); console.log('done');
