import { chromium } from 'playwright';
import fs from 'fs';
// usage: node gemini-dl-tmp.mjs <convurl> <outpng>  — download the LAST generated image at full res
const [,,url,out] = process.argv;
const live = JSON.parse(fs.readFileSync('test-results/mappa2-upscale/atlas/live-cookies.json','utf8'));
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',viewport:{width:1440,height:1000}});
await ctx.addCookies(live.map(k=>({name:k.name,value:String(k.value),domain:k.domain,path:k.path||'/',expires:k.expires||-1,secure:!!k.secure,httpOnly:!!k.httpOnly})));
const p = await ctx.newPage();
await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(10000);
const srcs = await p.$$eval('img', ims=>ims.filter(i=>i.naturalWidth>300).map(i=>({src:i.src,w:i.naturalWidth,h:i.naturalHeight})));
console.log('big imgs:',srcs.length);
if(srcs.length){
  const last = srcs[srcs.length-1];
  console.log('last src:',last.src.slice(0,90),last.w+'x'+last.h);
  const buf = await p.evaluate(async(u)=>{const r=await fetch(u);const b=await r.blob();const ab=await b.arrayBuffer();return Array.from(new Uint8Array(ab));}, last.src);
  fs.writeFileSync(out,Buffer.from(buf)); console.log('SAVED',out,buf.length);
}
await browser.close();
