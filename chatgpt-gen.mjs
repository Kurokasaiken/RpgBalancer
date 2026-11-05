import { chromium } from 'playwright';
const [, , infile, out, prompt] = process.argv;
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().find(x => x.url().includes('chatgpt')) || ctx.pages()[0];
await p.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(9000);
// attach: chatgpt has a hidden file input for uploads
const fi = p.locator('input[type=file]').first();
if (await fi.count() === 0) {
  // click the + menu then upload
  await p.keyboard.press('Escape').catch(()=>{});
  await p.locator('button[data-testid="composer-plus-btn"], button[aria-label*="attach"], button[aria-label*="aggiungi"], button[aria-label*="files"]').first().click({force:true}).catch(()=>{});
  await p.waitForTimeout(1500);
  const menuItem = p.locator('[role="menuitem"], button').filter({ hasText: /upload|carica|file/i }).first();
  const [fc] = await Promise.all([p.waitForEvent('filechooser',{timeout:15000}), menuItem.click({force:true}).catch(()=>{})]);
  await fc.setFiles(infile);
} else {
  await fi.setInputFiles(infile);
}
console.log('UPLOADED');
await p.waitForTimeout(6000);
const box = p.locator('#prompt-textarea, div[contenteditable=true]').first();
await box.click();
await box.fill(prompt);
await p.waitForTimeout(800);
await p.keyboard.press('Enter');
console.log('SUBMITTED');
await p.waitForTimeout(180000); // chatgpt image gen is slow
const imgs = await p.$$('img');
let best=null,ba=0;
for(const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}}
if(best){await best.screenshot({path:out});console.log('SAVED',Math.round(ba));}
console.log('URL:',p.url().slice(0,80));
process.exit(0);
