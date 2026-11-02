import { chromium } from 'playwright';
import yaml from 'js-yaml';
import fs from 'fs';
// usage: node gemini-headless-tmp.mjs new <infile> <outpng> <prompt>
const [,,mode,a,b,c] = process.argv;
const live = JSON.parse(fs.readFileSync('test-results/mappa2-upscale/atlas/live-cookies.json','utf8'));
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  viewport: {width:1440,height:1000},
});
await ctx.addCookies(live.map(k=>({name:k.name,value:String(k.value),domain:k.domain,path:k.path||'/',expires:k.expires||-1,secure:!!k.secure,httpOnly:!!k.httpOnly})));
const p = await ctx.newPage();
if(mode==='new'){
  let uploaded=false;
  for(let attempt=0;attempt<3&&!uploaded;attempt++){
    await p.goto('https://gemini.google.com/app',{waitUntil:'domcontentloaded',timeout:60000});
    await p.waitForTimeout(9000);
    await p.keyboard.press('Escape').catch(()=>{});
    const fi = p.locator('input[type="file"]').first();
    if(await fi.count()){ await fi.setInputFiles(a); uploaded=true; break; }
    const fcP=p.waitForEvent('filechooser',{timeout:12000}).catch(()=>null);
    await p.locator('button[aria-label*="pload"], button[aria-label*="Caricamento"], [aria-label*="tools"]').first().click({force:true,timeout:8000}).catch(()=>{});
    await p.waitForTimeout(1200);
    await p.locator('[role="menuitem"]:has-text("File"), [role="menuitem"]:has-text("ile"), button:has-text("File")').first().click({force:true,timeout:8000}).catch(()=>{});
    const fc=await fcP;
    if(fc){ await fc.setFiles(a); uploaded=true; }
    else console.log('upload attempt',attempt,'failed');
  }
  if(!uploaded){console.log('NO FILECHOOSER x3');await browser.close();process.exit(1);}
  await p.waitForTimeout(6000);
} else {
  await p.goto(a,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(10000);
}
const box = p.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click({timeout:15000}); await p.keyboard.type(c,{delay:1});
await p.waitForTimeout(800); await p.keyboard.press('Enter');
console.log('SUBMITTED',mode);
await p.waitForTimeout(110000);
const imgs = await p.$$('img');
let best=null,ba=0;
for(const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}}
if(best){
  await best.screenshot({path:b});console.log('SAVED',Math.round(ba));
  try{
    const src = await best.getAttribute('src');
    console.log('imgsrc:',(src||'').slice(0,100));
    const buf = await p.evaluate(async(u)=>{const r=await fetch(u);const ab=await r.arrayBuffer();return Array.from(new Uint8Array(ab));}, src);
    fs.writeFileSync(b.replace('.png','_full.png'),Buffer.from(buf));
    console.log('FULLRES',buf.length);
  }catch(e){console.log('fullres fail',String(e).slice(0,80));}
}
console.log('URL',p.url());
await browser.close();
