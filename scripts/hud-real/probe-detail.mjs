import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
console.log('detail-open:', await page.locator('[data-detail-open]').getAttribute('data-detail-open'));
console.log('can-send:', await page.locator('[data-can-send]').getAttribute('data-can-send'));
// is the production expedition detail panel open somewhere?
console.log('quest detail visible:', await page.locator('[data-testid*=quest], [class*=ExpeditionDetail], [class*=quest-detail]').count());
await b.close(); console.log('done');
