import { chromium } from 'playwright';
const [,,url,out] = process.argv;
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
let p = b.contexts()[0].pages().find(x=>!x.url().includes("google.com/app/")); if(!p) p = b.contexts()[0].pages()[0];
await p.goto(url, {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(15000);
const big=[];
for(const im of await p.$$('img')){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width>300)big.push(im);}
if(big.length){await big[big.length-1].screenshot({path:out});console.log('SAVED',big.length);}
await b.close();
