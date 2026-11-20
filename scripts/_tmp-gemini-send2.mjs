#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
const OUT = 'test-results/slicekit/frame-smeraldo/stash-interior/gen/stash-icons-sheet.png';
const PROMPT = `Genera un'immagine: una griglia 4 colonne x 2 righe di 7 icone di oggetti fantasy dipinte, sfondo PIATTO uniforme scuro (#0d1f1a). Stesso stile pittorico semi-realistico delle icone oggetto nel mockup allegato in precedenza (ottone/oro, toni gioiello, luce morbida). Ogni cella contiene UN solo oggetto centrato che riempie ~70% della cella:
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
const page = ctx.pages().find(p => p.url().includes('gemini.google.com'));
if (!page) { console.error('no gemini tab'); process.exit(1); }
// wait for pending generation to finish (max 3min)
for (let i = 0; i < 72; i++) {
  const pending = await page.evaluate(() => !!document.querySelector('[class*="loading"], [class*="thinking"], mat-progress-spinner, .progress-indicator'));
  if (!pending) break;
  await page.waitForTimeout(2500);
}
// type prompt
await page.evaluate((txt) => {
  const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
  ed.focus(); ed.textContent = '';
  document.execCommand('insertText', false, txt);
}, PROMPT);
await page.waitForTimeout(800);
// click the send button (fallback: Enter)
const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(e => /invia|send/i.test(e.getAttribute('aria-label') || '') && !e.disabled);
  if (b) { b.click(); return b.getAttribute('aria-label'); }
  return null;
});
console.log('send clicked:', clicked);
if (!clicked) { await page.keyboard.press('Enter'); console.log('sent via Enter'); }
await page.waitForTimeout(2000);
const msgs = await page.evaluate(() => document.querySelectorAll('USER-QUERY, user-query').length);
console.log('user msgs now:', msgs);
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img, MODEL-RESPONSE img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64 && !e.src.includes('gstatic') && !e.src.includes('googleusercontent.com/a/')).length, SEL);
  if (n === last.n && n >= 1) { if (++last.stable >= 5) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
const imgs = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64 && !e.src.includes('gstatic') && !e.src.includes('googleusercontent.com/a/')).map(e => ({ src: e.src, w: e.naturalWidth })), SEL);
console.log('candidate imgs:', JSON.stringify(imgs.map(i => i.src.slice(0,60) + ' w' + i.w)));
if (!imgs.length) { await page.screenshot({path:'/tmp/gemini-timeout3.png'}); process.exit(7); }
const lastSrc = imgs[imgs.length - 1].src;
let buf;
if (lastSrc.startsWith('data:')) buf = Buffer.from(lastSrc.split(',')[1], 'base64');
else if (lastSrc.startsWith('blob:')) { const r = await page.evaluate(async (u) => { const f = await fetch(u); const b = await f.arrayBuffer(); return [...new Uint8Array(b)]; }, lastSrc); buf = Buffer.from(r); }
else { const r = await fetch(lastSrc); buf = Buffer.from(await r.arrayBuffer()); }
fs.writeFileSync(OUT, buf);
console.log('saved:', OUT, buf.length, 'bytes');
process.exit(0);
