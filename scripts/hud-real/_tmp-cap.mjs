import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1400,height:800}, deviceScaleFactor:2 });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5173/bezel-variants',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
const row = p.locator('[data-testid="bezel-row-draghi"]');
await row.waitFor({timeout:15000});
await p.waitForTimeout(1500);
await row.screenshot({path:'/tmp/row-gemini.png'});
// zoom element
const zoom = row.locator('[data-testid*="zoom"], svg').last();
await b.close();
console.log('errors:',errs.length, errs.slice(0,3));
