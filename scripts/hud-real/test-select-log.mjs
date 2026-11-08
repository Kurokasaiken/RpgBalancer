import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('console', m => { if (m.text().includes('cassetto-host')) console.log('LOG', m.text().slice(0,200)); });
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
const card = page.locator('[data-resident-id]').first();
const box = await card.boundingBox();
if (box) { await page.mouse.click(box.x + 20, box.y + 20); await page.waitForTimeout(1500); }
await b.close(); console.log('done');
