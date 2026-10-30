import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://localhost:5173/game', {waitUntil:'networkidle', timeout:60000}).catch(()=>{});
await p.waitForTimeout(4000);
await p.click('text=VILLAGE').catch(e => console.log('click fail', e.message.slice(0,80)));
await p.waitForTimeout(3000);
await p.screenshot({path:'context/research/2026-10-29-mappa2-sprite-pilot/out/_village-hud.png'});
await b.close();
