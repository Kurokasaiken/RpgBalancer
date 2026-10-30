import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1300,height:2000}});
await p.goto('http://127.0.0.1:8611/context/research/2026-10-29-mappa2-sprite-pilot/');
await p.waitForTimeout(1500);
await p.screenshot({path:'context/research/2026-10-29-mappa2-sprite-pilot/out/_a9v3-pageshot.png', clip:{x:0,y:0,width:1300,height:2000}});
await b.close();
