import { chromium } from 'playwright';
const [,,INFILE,PROMPT,OUTFILE] = process.argv;
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.goto('https://gemini.google.com/app', {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(12000);
await p.keyboard.press('Escape').catch(()=>{});
await p.locator('button[aria-label*="Caricamento"]').first().click({force:true, timeout:10000}).catch(async()=>{await p.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(e=>(e.getAttribute('aria-label')||'').includes('Caricamento'));x&&x.click();});});
await p.waitForTimeout(2500);
const fcP = p.waitForEvent('filechooser',{timeout:20000}).catch(()=>null);
await p.locator('button:has-text("File"), [role="menuitem"]:has-text("File")').first().click({force:true,timeout:8000}).catch(()=>{});
const fc = await fcP;
if(!fc){console.log('NO FILECHOOSER');await b.close();process.exit(1);}
await fc.setFiles(INFILE);
await p.waitForTimeout(6000);
const box = p.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click(); await p.keyboard.type(PROMPT,{delay:1});
await p.waitForTimeout(800); await p.keyboard.press('Enter');
console.log('SUBMITTED');
await p.waitForTimeout(110000);
const imgs = await p.$$('img');
let best=null,ba=0;
for(const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}}
if(best){await best.screenshot({path:OUTFILE});console.log('SAVED');}
console.log('URL',p.url());
await b.close();
