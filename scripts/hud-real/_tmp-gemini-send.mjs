import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const IMGS = [
  '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/opzione-A.png',
  '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/medaglione-da-solo.png',
  '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/cassetto-open-right.png',
  '/Users/faustoboni/progetti_personali/mind-weaver/.mw/runs/20261110-chatgpt-ghiera/game-full.png',
];
const prompt = readFileSync('/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/prompt4-gemini.txt','utf8');
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
let p = ctx.pages().filter(pg => pg.url().includes('gemini.google.com')).pop();
if (!p) { p = await ctx.newPage(); await p.goto('https://gemini.google.com/app',{waitUntil:'domcontentloaded'}); }
await p.bringToFront().catch(()=>{});
await p.waitForTimeout(4000);
const composer = p.locator('div[contenteditable="true"]').first();
if (await composer.count()) {
  await composer.click();
  // only type if composer is empty
  const txt = await composer.innerText().catch(()=> '');
  if (!txt || txt.trim().length < 20) await p.keyboard.insertText(prompt);
}
await p.waitForTimeout(800);
// try filechooser via the "+" upload button
let attached = false;
const plus = p.locator('button[aria-label*="Allega" i], button[aria-label*="upload" i], button[aria-label*="file" i], button[aria-label*="immagine" i], [data-test-id*="upload" i], button:has-text("+")');
for (let i = 0; i < await plus.count() && !attached; i++) {
  try {
    const chooserP = p.waitForEvent('filechooser', {timeout: 4000});
    await plus.nth(i).click({timeout: 2000});
    const chooser = await chooserP;
    await chooser.setFiles(IMGS);
    attached = true;
    console.log('attached via chooser on button', i);
  } catch (e) { /* next */ }
}
if (!attached) {
  // last resort: look for file inputs again (some appear after menu opens)
  const inputs = await p.locator('input[type="file"]').all();
  console.log('file inputs found:', inputs.length);
  for (const inp of inputs) {
    try { await inp.setInputFiles(IMGS); attached = true; console.log('attached via input'); break; } catch(e){}
  }
}
await p.waitForTimeout(3000);
await p.screenshot({path:'/tmp/gemini-composed.png'});
console.log('attached:', attached);
