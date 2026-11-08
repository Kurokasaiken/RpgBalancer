import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
await page.locator('[data-cassetto-debug="select-first"]').click();
await page.waitForTimeout(3000);
console.log('assigned:', await page.locator('[data-assigned]').getAttribute('data-assigned'));
await b.close(); console.log('done');
