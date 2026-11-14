#!/usr/bin/env node
// De-text the approved mockup in a dedicated Gemini chat (background tab).
import { chromium } from 'playwright';
import fs from 'fs';
const SRC = '.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg';
const OUT = '.mw/specs/poi-radial/gen/mockup-detext.png';
const PROMPT = `Edit this image: remove ALL text labels and letters from every card/plate in the fan (TAGLIALEGNA, MINA, AGRICOLTURA, FORGIA, MERCATO, TAVERNA, MAPPA DEL MONDO, and any other text), replacing each text area with the same painted vitreous enamel texture that surrounds it. Keep every other element pixel-identical: the cards' shapes, gold borders, gems, painted icons, the central village diorama on its gold pedestal, and the painted map background must remain exactly as they are.`;
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
// attach mockup
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
if (last.n < 1) { console.error('no image'); await page.screenshot({path:'/tmp/gemini-noimg.png'}); process.exit(5); }
const b64 = await page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64);
  const el = els[els.length - 1];
  const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
}, SEL);
fs.mkdirSync('.mw/specs/poi-radial/gen', { recursive: true });
fs.writeFileSync(OUT, Buffer.from(b64.data, 'base64'));
console.log('saved', OUT, b64.w + 'x' + b64.h);
process.exit(0);
