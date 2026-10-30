import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const pages = ctx.pages().filter(p=>p.url().includes('gemini.google.com/app/'));
console.log('conv pages:', pages.map(p=>p.url()));
const p = pages[pages.length-1];
await p.waitForTimeout(20000);
const imgs = await p.$$('img');
let best=null,ba=0;
for (const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}}
if(best){await best.screenshot({path:'/tmp/mappa2-upscale-test/hero_gemini_final.png'});console.log('SAVED',Math.round(ba));}
else console.log('NO IMG');
await b.close();
