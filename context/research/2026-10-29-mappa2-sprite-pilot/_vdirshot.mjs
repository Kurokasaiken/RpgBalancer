import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1600,height:950}});
const errs = [];
p.on('pageerror', e => errs.push(e.message.slice(0,120)));
await p.goto('http://localhost:5173/game', {waitUntil:'domcontentloaded', timeout:60000}).catch(()=>{});
await p.waitForTimeout(5000);
await p.click('text=VILLAGE').catch(e => console.log('tab fail', e.message.slice(0,80)));
await p.waitForTimeout(2500);
// accendi un paio di edifici dal director panel
const acts = p.locator('[data-testid="director-panel"] button');
const n = await acts.count();
console.log('director actions:', n);
if (n > 4) { await acts.nth(1).click(); await acts.nth(3).click(); await acts.nth(5).click(); }
await p.waitForTimeout(600);
await p.screenshot({path:'context/research/2026-10-29-mappa2-sprite-pilot/out/_village-director.png'});
console.log('pageerrors:', JSON.stringify(errs));
await b.close();
