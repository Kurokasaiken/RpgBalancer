import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
await page.locator('[data-cassetto-debug="select-first"]').click();
await page.waitForTimeout(500);
// probe the flight proxy by any means — capture ALL new elements added
await page.waitForTimeout(2000);
const state = await page.evaluate(() => {
  const slot = document.querySelector('[data-slot-id="poi-goblin:goblin-slot-leader"]');
  return {
    slotState: slot?.querySelector('.slot-v12')?.getAttribute('data-slot-state'),
    canSend: document.querySelector('[data-can-send]')?.getAttribute('data-can-send'),
  };
});
console.log('leader state:', JSON.stringify(state));
const wbox = await page.locator('[data-hudreal-cassetto]').boundingBox();
await page.screenshot({path:'test-results/seat-final.png', clip: wbox ?? undefined});
await b.close(); console.log('done');
