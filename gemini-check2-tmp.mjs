import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const p = await b.contexts()[0].newPage();
await p.goto('https://gemini.google.com/app/7369c3cda4e230c8', {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(25000);
const imgs = await p.$$('img');
let n=0;
for(const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width>300)n++;}
console.log('big imgs:',n);
const spin = await p.$$('[class*="loading"], [class*="spinner"], [aria-busy="true"]');
console.log('spinners:',spin.length);
await b.close();
