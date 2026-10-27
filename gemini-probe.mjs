import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().find(x=>x.url().includes('gemini')) || await ctx.newPage();
// attach ref
await p.locator('button[aria-label*="Caricamento"]').first().click();
await p.waitForTimeout(1500);
const [fc] = await Promise.all([
  p.waitForEvent('filechooser', {timeout: 10000}),
  p.locator('button:has-text("File")').first().click(),
]);
await fc.setFiles('/Users/faustoboni/progetti_personali/RPG/src/assets/mood/rude-beauty/villaggio.png');
await p.waitForTimeout(4000);
console.log('attach previews:', await p.locator('img[src^="blob:"]').count());
// prompt
const prompt = fs.readFileSync('/tmp/f1-ablation/B.txt','utf8').trim();
const box = p.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click();
await p.keyboard.press('Meta+a');
await p.keyboard.type(prompt, {delay: 1});
await p.waitForTimeout(800);
await p.keyboard.press('Enter');
console.log('B SUBMITTED');
await b.close();
