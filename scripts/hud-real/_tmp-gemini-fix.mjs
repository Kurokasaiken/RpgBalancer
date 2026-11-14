import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const IMG = '/Users/faustoboni/progetti_personali/RPG/public/assets/ui/hud-real/ghiera-draghi.png';
const prompt = readFileSync('/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/prompt8-gemini-fix.txt','utf8');
const b = await chromium.connectOverCDP('http://localhost:9222', { timeout: 90000 });
const ctx = b.contexts()[0];
let p = ctx.pages().filter(pg => pg.url().includes('gemini.google.com/app')).pop();
if (!p) { p = await ctx.newPage(); await p.goto('https://gemini.google.com/app',{waitUntil:'domcontentloaded'}); }
await p.waitForTimeout(3000);
const composer = p.locator('div[contenteditable="true"]').first();
await composer.click();
await p.keyboard.insertText(prompt);
await p.waitForTimeout(800);
let attached = false;
const plus = p.locator('button[aria-label*="Allega" i], button[aria-label*="upload" i], button[aria-label*="file" i], button[aria-label*="immagine" i], [data-test-id*="upload" i], button:has-text("+")');
for (let i = 0; i < await plus.count() && !attached; i++) {
  try {
    const chooserP = p.waitForEvent('filechooser', {timeout: 4000});
    await plus.nth(i).click({timeout: 2000});
    const chooser = await chooserP;
    await chooser.setFiles(IMG);
    attached = true;
    console.log('attached via chooser on button', i);
  } catch (e) {}
}
if (!attached) {
  const inputs = await p.locator('input[type="file"]').all();
  for (const inp of inputs) {
    try { await inp.setInputFiles(IMG); attached = true; console.log('attached via input'); break; } catch(e){}
  }
}
await p.waitForTimeout(2500);
await p.screenshot({path:'/tmp/gemini-fix-composed.png'});
console.log('attached:', attached);
