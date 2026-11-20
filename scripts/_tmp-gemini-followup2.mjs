#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
const OUT = 'test-results/slicekit/frame-smeraldo/stash-interior/gen/stash-icons-sheet.png';
const PROMPT = `Genera un'immagine: una griglia 4 colonne x 2 righe di 7 icone di oggetti fantasy dipinte, sfondo PIATTO uniforme scuro (#0d1f1a). Stesso stile pittorico semi-realistico delle icone oggetto nel mockup allegato (ottone/oro, toni gioiello, luce morbida). Ogni cella contiene UN solo oggetto centrato che riempie ~70% della cella:
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
await page.evaluate((txt) => {
  const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
  ed.focus(); ed.textContent = '';
  document.execCommand('insertText', false, txt);
}, PROMPT);
await page.waitForTimeout(600);
await page.keyboard.press('Enter');
console.log('sent follow-up');
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img, MODEL-RESPONSE img';
const baseN = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64 && !e.src.includes('gstatic') && !e.src.includes('googleusercontent.com/a/')).length, SEL);
console.log('baseline imgs:', baseN);
let last = { n: baseN, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64 && !e.src.includes('gstatic') && !e.src.includes('googleusercontent.com/a/')).length, SEL);
  if (n === last.n && n > baseN) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
const imgs = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64 && !e.src.includes('gstatic') && !e.src.includes('googleusercontent.com/a/')).map(e => e.src), SEL);
console.log('images:', imgs.length);
if (imgs.length <= 1) { await page.screenshot({path:'/tmp/gemini-timeout2.png'}); console.log('no new image'); process.exit(7); }
const lastSrc = imgs[imgs.length - 1];
let buf;
if (lastSrc.startsWith('data:')) buf = Buffer.from(lastSrc.split(',')[1], 'base64');
else if (lastSrc.startsWith('blob:')) { const r = await page.evaluate(async (u) => { const f = await fetch(u); const b = await f.arrayBuffer(); return [...new Uint8Array(b)]; }, lastSrc); buf = Buffer.from(r); }
else { const r = await fetch(lastSrc); buf = Buffer.from(await r.arrayBuffer()); }
fs.writeFileSync(OUT, buf);
console.log('saved:', OUT, buf.length, 'bytes');
process.exit(0);
