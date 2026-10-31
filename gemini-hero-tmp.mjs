import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.goto('https://gemini.google.com/app', {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(12000);
await p.keyboard.press('Escape').catch(()=>{});
const up = p.locator('button[aria-label*="Caricamento"]').first();
await up.click({force:true, timeout:10000}).catch(async () => {
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(e=>(e.getAttribute('aria-label')||'').includes('Caricamento')); x&&x.click(); });
});
await p.waitForTimeout(2500);
const fcP = p.waitForEvent('filechooser', {timeout: 20000}).catch(()=>null);
await p.locator('button:has-text("File"), [role="menuitem"]:has-text("File")').first().click({force:true, timeout:8000}).catch(()=>{});
const fc = await fcP;
if(!fc){console.log('NO FILECHOOSER'); await b.close(); process.exit(1);}
await fc.setFiles('/tmp/mappa2-upscale-test/hero_waterfall_x4.png');
await p.waitForTimeout(6000);
const prompt = `la cascata, l'acqua, le rocce e la vegetazione a questa distanza mancano di dettagli. La puoi ridisegnare identica come scena, sotto tutti i punti di vista, ma con dettagli ricchi come se l'artista l'avesse dipinta a questa distanza?`;
const box = p.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click(); await p.keyboard.type(prompt, {delay: 1});
await p.waitForTimeout(800); await p.keyboard.press('Enter');
console.log('SUBMITTED', p.url());
await p.waitForTimeout(110000);
const imgs = await p.$$('img');
let best=null,ba=0;
for (const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}}
if(best){await best.screenshot({path:'/tmp/mappa2-upscale-test/hero_gemini_final.png'});console.log('SAVED',Math.round(ba));}
console.log('URL', p.url());
await b.close();
