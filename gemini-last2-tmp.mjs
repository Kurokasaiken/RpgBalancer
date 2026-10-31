import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const p = await b.contexts()[0].newPage();
await p.goto('https://gemini.google.com/app/cbd254d019b7e0cc', {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(15000);
const big = [];
for(const im of await p.$$('img')){
  const bb=await im.boundingBox().catch(()=>null);
  if(bb&&bb.width>300) big.push(im);
}
console.log('big imgs:', big.length);
if(big.length){
  const last = big[big.length-1];
  await last.screenshot({path:'/tmp/mappa2-upscale-test/bayou_last.png'});
  console.log('SAVED last');
}
// also check last text response
const txt = await p.$$eval('[class*="response"], .message-content', els=>els.slice(-1).map(e=>e.innerText.slice(0,300)));
console.log('LAST TEXT:', JSON.stringify(txt).slice(0,400));
await b.close();
