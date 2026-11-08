import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('console', m => { if (m.text().includes('cassetto-host')) console.log('LOG', m.text().slice(0,250)); });
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
// click the giggiolillo card — the real roster path
const card = page.locator('[data-resident-id="hero-giggiolillo"]');
const box = await card.boundingBox();
if (box) { await page.mouse.click(box.x + 30, box.y + 30); await page.waitForTimeout(3000); }
console.log('assigned:', await page.locator('[data-assigned]').getAttribute('data-assigned'));
await b.close(); console.log('done');
