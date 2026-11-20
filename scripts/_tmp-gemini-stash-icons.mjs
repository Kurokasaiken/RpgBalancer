#!/usr/bin/env node
// R-363 stash icons sheet — Gemini via Director's visible browser (background tab, CTR-foreground-001).
import { chromium } from 'playwright';
import fs from 'fs';
const SRC = '.mw/specs/expedition-ui/refs/mockup-stash-grid.jpg'; // style reference attach
const OUT = 'test-results/slicekit/frame-smeraldo/stash-interior/gen/stash-icons-sheet.png';
const PROMPT = `Generate a NEW image: a 4-column x 2-row grid of 7 painted fantasy game item icons on a FLAT UNIFORM dark background (#0d1f1a), in the same painted semi-realistic style as the item icons in the attached inventory mockup (brass/gold and jewel tones, soft painterly lighting, subtle drop shadow). Each cell contains exactly ONE centered item filling ~70% of the cell, with generous margin between cells:
(1) a polished steel dumbbell with ornate brass caps
(2) a brass spyglass with engraved rings
(3) a round black iron smoke bomb with a short fuse
(4) a coiled hemp rope with whipped ends
(5) a small corked glass vial of glowing red liquid
(6) a faceted glass bottle of luminous blue liquid with a brass stopper
(7) a small heraldic banner on a brass pole
The 8th cell (bottom-right) is EMPTY — just the flat background.
NO text, NO letters, NO numbers, NO frames, NO borders, NO wells — only the painted items on the flat dark background. Consistent style and lighting across all seven icons.`;
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const cdp = await browser.newBrowserCDPSession();
await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
let page;
for (let i = 0; i < 80; i++) { page = ctx.pages().find(p => p.url() === 'about:blank'); if (page) break; await new Promise(r => setTimeout(r, 250)); }
if (!page) { console.error('no bg tab'); process.exit(3); }
await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('on:', page.url());
let editorOk = false;
for (let i = 0; i < 60 && !editorOk; i++) {
  editorOk = await page.evaluate(() => !!document.querySelector('.ql-editor, div[contenteditable="true"]'));
  if (!editorOk) await page.waitForTimeout(2000);
}
if (!editorOk) { console.error('no editor — captcha?', page.url()); await page.screenshot({path:'/tmp/gemini-state.png'}); process.exit(6); }
let attached = false;
for (let t = 0; t < 5 && !attached; t++) {
  const nIn = await page.evaluate(() => document.querySelectorAll('input[type="file"]').length);
  if (nIn === 0) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(e => /caricamento|upload|allega|aggiungi/i.test(e.getAttribute('aria-label') || ''));
      b?.click();
    });
    await page.waitForTimeout(2500);
    await page.evaluate(() => { const m=[...document.querySelectorAll('[role="menuitem"],button')].find(e=>/carica file|upload file/i.test(e.textContent||'')); m?.click(); });
    await page.waitForTimeout(1500);
  }
  const fis = page.locator('input[type="file"]');
  for (let i = 0; i < await fis.count(); i++) {
    const accept = (await fis.nth(i).getAttribute('accept')) || '';
    if (accept && !/image|\*/.test(accept)) continue;
    try { await fis.nth(i).setInputFiles(SRC); attached = true; break; } catch {}
  }
}
console.log('attached:', attached);
if (!attached) { await page.screenshot({path:'/tmp/gemini-attach.png'}); process.exit(4); }
await page.waitForTimeout(4000);
await page.evaluate((txt) => {
  const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
  ed.focus(); ed.textContent = '';
  document.execCommand('insertText', false, txt);
}, PROMPT);
await page.waitForTimeout(600);
await page.keyboard.press('Enter');
console.log('sent');
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
  if (n === last.n && n >= 1) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
const imgs = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).map(e => e.src), SEL);
console.log('images:', imgs.length);
if (!imgs.length) { await page.screenshot({path:'/tmp/gemini-timeout.png'}); process.exit(7); }
const lastSrc = imgs[imgs.length - 1];
let buf;
if (lastSrc.startsWith('data:')) buf = Buffer.from(lastSrc.split(',')[1], 'base64');
else { const r = await page.evaluate(async (u) => { const f = await fetch(u); const b = await f.arrayBuffer(); return [...new Uint8Array(b)]; }, lastSrc); buf = Buffer.from(r); }
fs.writeFileSync(OUT, buf);
console.log('saved:', OUT, buf.length, 'bytes');
process.exit(0);
