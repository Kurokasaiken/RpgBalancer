import { chromium } from 'playwright';
import fs from 'fs';
const [,,url,out] = process.argv;
const live = JSON.parse(fs.readFileSync('test-results/mappa2-upscale/atlas/live-cookies.json','utf8'));
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',viewport:{width:1440,height:1400}});
await ctx.addCookies(live.map(k=>({name:k.name,value:String(k.value),domain:k.domain,path:k.path||'/',expires:k.expires||-1,secure:!!k.secure,httpOnly:!!k.httpOnly})));
const p = await ctx.newPage();
await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(8000);
for(let i=0;i<8;i++){ await p.mouse.wheel(0,900); await p.waitForTimeout(1500); }
const info = await p.evaluate(()=>({
  imgs:[...document.querySelectorAll('img')].map(i=>({src:i.src.slice(0,110),nw:i.naturalWidth,r:Math.round(i.getBoundingClientRect().width)})),
  ggs:[...document.documentElement.innerHTML.matchAll(/lh3\.googleusercontent\.com\/gg[^"'()\s\\]*/g)].map(m=>m[0]).slice(-6),
}));
console.log(JSON.stringify(info,null,1).slice(0,3000));
await browser.close();
