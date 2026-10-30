import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1600,height:950}});
await p.goto('http://localhost:5173/mappa2-lab', {waitUntil:'domcontentloaded', timeout:60000}).catch(()=>{});
await p.waitForSelector('body[data-mappa2-lab="true"]', {timeout:90000}).catch(()=>{});
await p.waitForTimeout(6000);
await p.screenshot({path:'context/research/2026-10-29-mappa2-sprite-pilot/out/_lab-village-v3.png', clip:{x:520,y:280,width:700,height:500}});
await b.close();
