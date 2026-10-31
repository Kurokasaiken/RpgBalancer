import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const p = await b.contexts()[0].newPage();
await p.goto('https://gemini.google.com/app/cbd254d019b7e0cc', {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(15000);
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
await p.waitForTimeout(3000);
const imgs = await p.$$('img');
let best=null,ba=0;
for(const im of imgs){
  const bb=await im.boundingBox().catch(()=>null);
  if(!bb||bb.width<300) continue;
  const src=(await im.getAttribute('src')||'').slice(0,60);
  console.log(Math.round(bb.width)+'x'+Math.round(bb.height), src);
  if(bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}
}
if(best){await best.screenshot({path:'/tmp/mappa2-upscale-test/bayou_free_latest.png'});console.log('SAVED',Math.round(ba));}
await b.close();
