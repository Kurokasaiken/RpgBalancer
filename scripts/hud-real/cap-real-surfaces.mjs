import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
// real quest run window on /game — open the goblin expedition detail
await page.goto('http://localhost:5173/game',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(5000);
await page.screenshot({path:'test-results/real-game.png'});
// hud-compose with real components visible
await page.goto('http://localhost:5173/hud-compose?comp=triad&view=context',{waitUntil:'networkidle',timeout:30000});
await page.waitForTimeout(4500);
await page.screenshot({path:'test-results/real-triad.png'});
await b.close(); console.log('done');
