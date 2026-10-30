import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.goto('https://gemini.google.com/app', {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(12000);
// dismiss possible overlays
await p.keyboard.press('Escape').catch(()=>{});
const up = p.locator('button[aria-label*="Caricamento"]').first();
await up.click({force:true, timeout:10000}).catch(async e => {
  console.log('force click failed:', e.message.slice(0,120));
  await p.evaluate(() => { const b=[...document.querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||'').includes('Caricamento')); b&&b.click(); });
});
await p.waitForTimeout(2500);
const menu = await p.$$eval('button,[role="menuitem"]', els => els.map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim()).filter(t=>t.length<40));
console.log('menu items:', JSON.stringify(menu.slice(0,25)));
const fcPromise = p.waitForEvent('filechooser', {timeout: 20000}).catch(()=>null);
const fileBtn = p.locator('button:has-text("File"), [role="menuitem"]:has-text("File"), [role="menuitem"]:has-text("file")').first();
await fileBtn.click({force:true, timeout:8000}).catch(e=>console.log('file click:', e.message.slice(0,100)));
const fc = await fcPromise;
if(!fc){console.log('NO FILECHOOSER'); await b.close(); process.exit(1);}
await fc.setFiles('/tmp/mappa2-upscale-test/hero_waterfall_x4.png');
await p.waitForTimeout(6000);
const prompt = `la cascata, l'acqua, le rocce e la vegetazione a questa distanza mancano di dettagli. La puoi ridisegnare identica come scena, sotto tutti i punti di vista, ma con dettagli ricchi come se l'artista l'avesse dipinta a questa distanza?`;
const box = p.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click(); await p.keyboard.type(prompt, {delay: 1});
await p.waitForTimeout(800); await p.keyboard.press('Enter');
console.log('SUBMITTED');
await p.waitForTimeout(100000);
const imgs = await p.$$('img');
let best=null,ba=0;
for (const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}}
if(best){await best.screenshot({path:'/tmp/mappa2-upscale-test/hero_gemini_final.png'});console.log('SAVED');}
console.log('URL', p.url());
await b.close();
