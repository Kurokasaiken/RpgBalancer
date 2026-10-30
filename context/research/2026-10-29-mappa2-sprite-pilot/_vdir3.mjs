import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1600,height:950}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,100)));
await p.goto('http://localhost:5173/game', {waitUntil:'domcontentloaded', timeout:60000}).catch(()=>{});
await p.waitForTimeout(5000);
await p.click('text=VILLAGE').catch(()=>{});
await p.waitForTimeout(2500);
await p.screenshot({path:'context/research/2026-10-29-mappa2-sprite-pilot/out/_vdir-plots.png'});
// assegna inn alla piazzola pl-inn
await p.locator('[data-plot="pl-inn"]').click().catch(()=>{});
await p.locator('[data-testid="director-panel"] button', {hasText:'inn'}).first().click().catch(()=>{});
await p.waitForTimeout(400);
await p.screenshot({path:'context/research/2026-10-29-mappa2-sprite-pilot/out/_vdir-assigned.png'});
console.log('errs:', JSON.stringify(errs));
await b.close();
