import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const IMGS = [
  '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/opzione-A.png',
  '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/medaglione-da-solo.png',
];
const prompt = readFileSync('/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/prompt6.txt','utf8');
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
let p = ctx.pages().filter(pg => pg.url().includes('gemini.google.com')).pop();
if (!p) { p = await ctx.newPage(); await p.goto('https://gemini.google.com/app',{waitUntil:'domcontentloaded'}); }
await p.waitForTimeout(3000);
const composer = p.locator('div[contenteditable="true"]').first();
await composer.click();
await p.keyboard.insertText(prompt);
await p.waitForTimeout(800);
await p.locator('button[aria-label="Caricamento e strumenti"]').first().click();
await p.waitForTimeout(1000);
const cp = p.waitForEvent('filechooser', {timeout: 8000});
await p.locator('button[aria-label*="Carica file"]').first().click();
const chooser = await cp;
await chooser.setFiles(IMGS);
console.log('attached 2');
await p.waitForTimeout(5000);
await p.locator('button[aria-label="Invia messaggio"]').first().click();
console.log('sent');
await p.waitForTimeout(90000);
await p.screenshot({path:'/tmp/gemini-resp2.png'});
