import { chromium } from 'playwright';
import fs from 'fs';
// usage: node gemini-paste-tmp.mjs <convurl|'new'> <infile> <outpng> <prompt>
const [,,conv,infile,out,prompt] = process.argv;
const live = JSON.parse(fs.readFileSync('test-results/mappa2-upscale/atlas/live-cookies.json','utf8'));
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',viewport:{width:1440,height:1000}});
await ctx.addCookies(live.map(k=>({name:k.name,value:String(k.value),domain:k.domain,path:k.path||'/',expires:k.expires||-1,secure:!!k.secure,httpOnly:!!k.httpOnly})));
await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:'https://gemini.google.com'});
const p = await ctx.newPage();
await p.goto(conv==='new'?'https://gemini.google.com/app':conv,{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(10000);
await p.keyboard.press('Escape').catch(()=>{});
await p.evaluate(()=>{const o=document.querySelector('.cdk-overlay-container .banner-body button, .cdk-overlay-container [class*="close"], .cdk-overlay-container button');o&&o.click();}).catch(()=>{});
await p.waitForTimeout(1500);
const b64 = fs.readFileSync(infile).toString('base64');
const ok = await p.evaluate(async(b64)=>{
  const res = await fetch('data:image/png;base64,'+b64);
  const blob = await res.blob();
  await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
  return true;
}, b64).catch(e=>{console.log('clipfail',String(e).slice(0,120));return false;});
if(!ok){await browser.close();process.exit(1);}
const box = p.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click({force:true,timeout:15000}).catch(async()=>{await p.evaluate(()=>document.querySelector('div[contenteditable="true"]')?.focus());});
await p.keyboard.press('Control+v').catch(()=>{});
await p.keyboard.press('Meta+v').catch(()=>{});
await p.waitForTimeout(6000);
const thumbs = await p.$$eval('img',ims=>ims.filter(i=>i.src.startsWith('blob:')||(i.getAttribute('style')||'').includes('blob')).length);
console.log('thumbs',thumbs);
await p.keyboard.type(prompt,{delay:1});
await p.waitForTimeout(800); await p.keyboard.press('Enter');
console.log('SUBMITTED');
await p.waitForTimeout(115000);
const imgs = await p.$$('img');
let best=null,ba=0;
for(const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}}
if(best){await best.screenshot({path:out});console.log('SAVED',Math.round(ba));
  try{const src=await best.getAttribute('src');const buf=await p.evaluate(async(u)=>{const r=await fetch(u);const ab=await r.arrayBuffer();return Array.from(new Uint8Array(ab));},src);fs.writeFileSync(out.replace('.png','_full.png'),Buffer.from(buf));console.log('FULLRES',buf.length);}catch(e){console.log('fullres fail');}}
console.log('URL',p.url());
await browser.close();
