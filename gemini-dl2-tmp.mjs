import { chromium } from 'playwright';
import fs from 'fs';
const [,,url,out] = process.argv;
const live = JSON.parse(fs.readFileSync('test-results/mappa2-upscale/atlas/live-cookies.json','utf8'));
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',viewport:{width:1440,height:1000}});
await ctx.addCookies(live.map(k=>({name:k.name,value:String(k.value),domain:k.domain,path:k.path||'/',expires:k.expires||-1,secure:!!k.secure,httpOnly:!!k.httpOnly})));
const p = await ctx.newPage();
await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(12000);
const info = await p.evaluate(()=>{
  const ims=[...document.querySelectorAll('img')].map(i=>({src:i.src.slice(0,100),nw:i.naturalWidth,r:Math.round(i.getBoundingClientRect().width)}));
  const bgs=[...document.querySelectorAll('[style*="background-image"],[style*="background:"]')].map(e=>(e.getAttribute('style')||'').slice(0,140));
  return {ims:ims.slice(-10),bgs:bgs.slice(-8),html:document.body.innerHTML.match(/lh3\.googleusercontent\.com\/[^"'()\s]+/g)?.slice(-5)||[]};
});
console.log(JSON.stringify(info,null,1).slice(0,2500));
await browser.close();
