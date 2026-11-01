import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
let p = b.contexts()[0].pages().find(x=>!x.url().includes("google.com/app/")); if(!p) p = b.contexts()[0].pages()[0];
await p.goto('https://gemini.google.com/app/cbd254d019b7e0cc', {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(15000);
const big=[];
for(const im of await p.$$('img')){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width>300)big.push(im);}
console.log('imgs:',big.length);
if(big.length){await big[big.length-1].screenshot({path:'/tmp/mappa2-upscale-test/bayou_v7.png'});console.log('SAVED');}
await b.close();
