#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
const SRC = '.mw/specs/expedition-ui/refs/mockup-stash-grid.jpg';
const OUT = 'test-results/slicekit/frame-smeraldo/stash-interior/gen/stash-icons-sheet.png';
const PROMPT = `Genera una nuova immagine: una griglia 4 colonne x 2 righe di 7 icone di oggetti fantasy dipinte, sfondo PIATTO uniforme scuro (#0d1f1a). Stesso stile pittorico semi-realistico delle icone oggetto nel mockup allegato (ottone/oro, toni gioiello, luce morbida). Ogni cella contiene UN solo oggetto centrato che riempie ~70% della cella:
(1) bilanciere in acciaio lucidato con capocchie in ottone
(2) cannocchiale in ottone con anelli incisi
(3) bomba nera rotonda di ferro con miccia corta
(4) corda di canapa arrotolata
(5) ampollina di vetro con liquido rosso luminoso e tappo
(6) bottiglia di vetro sfaccettata con liquido blu luminoso e tappo in ottone
(7) piccolo stendardo araldico su asta in ottone
L'ottava cella (in basso a destra) resta VUOTA, solo sfondo.
NESSUN testo, NESSUNA lettera, NESSUNA cornice o bordo — solo gli oggetti dipinti sullo sfondo piatto. Stesso stile e luce per tutte e sette le icone.`;
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
if (!editorOk) { console.error('no editor'); process.exit(6); }
// attach style reference
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
if (!attached) { await page.screenshot({path:'/tmp/gemini-attach2.png'}); process.exit(4); }
await page.waitForTimeout(4000);
// type via real focus + insertText so the send button enables
const ed = page.locator('.ql-editor, div[contenteditable="true"]').first();
await ed.click();
await page.keyboard.insertText(PROMPT);
await page.waitForTimeout(1000);
const typed = await page.evaluate(() => (document.querySelector('.ql-editor, div[contenteditable="true"]')?.innerText || '').length);
console.log('typed chars:', typed);
// find send button (appears when editor has text)
let sent = false;
for (let i = 0; i < 10 && !sent; i++) {
  const lbl = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(e => /invia|send/i.test(e.getAttribute('aria-label') || '') && !e.disabled);
    if (b) { b.click(); return b.getAttribute('aria-label'); }
    return null;
  });
  if (lbl) { console.log('send clicked:', lbl); sent = true; break; }
  await page.waitForTimeout(1000);
}
if (!sent) { await page.keyboard.press('Enter'); console.log('sent via Enter'); }
await page.waitForTimeout(3000);
const msgs = await page.evaluate(() => document.querySelectorAll('USER-QUERY, user-query').length);
console.log('user msgs:', msgs);
if (msgs === 0) { await page.screenshot({path:'/tmp/gemini-notsent.png'}); process.exit(8); }
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img, MODEL-RESPONSE img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64 && !e.src.includes('gstatic') && !e.src.includes('googleusercontent.com/a/') && !e.src.includes('blob:')).length, SEL);
  if (n === last.n && n >= 1) { if (++last.stable >= 5) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
const imgs = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64 && !e.src.includes('gstatic') && !e.src.includes('googleusercontent.com/a/')).map(e => e.src), SEL);
console.log('imgs found:', imgs.length);
if (!imgs.length) { await page.screenshot({path:'/tmp/gemini-timeout4.png'}); process.exit(7); }
const lastSrc = imgs[imgs.length - 1];
let buf;
if (lastSrc.startsWith('data:')) buf = Buffer.from(lastSrc.split(',')[1], 'base64');
else if (lastSrc.startsWith('blob:')) { const r = await page.evaluate(async (u) => { const f = await fetch(u); const b = await f.arrayBuffer(); return [...new Uint8Array(b)]; }, lastSrc); buf = Buffer.from(r); }
else { const r = await fetch(lastSrc); buf = Buffer.from(await r.arrayBuffer()); }
fs.writeFileSync(OUT, buf);
console.log('saved:', OUT, buf.length, 'bytes');
process.exit(0);
