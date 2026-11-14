#!/usr/bin/env node
// F2 rework: derive assets FROM the mockup. Step 1 — de-text anchored edit.
import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '.mw/specs/poi-radial/gen/mockup-notext.png';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const cdp = await browser.newBrowserCDPSession();
await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
let page;
for (let i = 0; i < 120; i++) { page = ctx.pages().find(p => p.url() === 'about:blank'); if (page) break; await new Promise(r => setTimeout(r, 250)); }
if (!page) { console.error('no bg tab'); process.exit(3); }
await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
let ok = false;
for (let i = 0; i < 60 && !ok; i++) { ok = await page.evaluate(() => !!document.querySelector('.ql-editor, div[contenteditable="true"]')); if (!ok) await page.waitForTimeout(2000); }
if (!ok) { console.error('no editor'); process.exit(6); }
// attach mockup
let attached = false;
for (let a = 0; a < 4 && !attached; a++) {
  await page.locator('button[aria-label="Caricamento e strumenti"]').first().click({ noWaitAfter: true, force: true }).catch(() => {});
  await page.waitForTimeout(2500);
  const it = page.locator('button:has-text("Carica file")').first();
  if (await it.count() === 0) { await page.keyboard.press('Escape'); await page.waitForTimeout(1200); continue; }
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }),
      it.click({ noWaitAfter: true }),
    ]);
    await chooser.setFiles('.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg');
    attached = true;
  } catch { await page.keyboard.press('Escape'); await page.waitForTimeout(1200); }
}
console.log('attached:', attached);
if (!attached) process.exit(4);
await page.waitForTimeout(3500);
await page.evaluate((txt) => {
  const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
  ed.focus(); document.execCommand('insertText', false, txt);
}, `Edit this image: remove ALL text labels from every card of the fan (TAGLIALEGNA, MINA, AGRICOLTURA, FORGIA, MERCATO, TAVERNA, MAPPA DEL MONDO and any other lettering). Fill the space where the text was with the same enamel material and shading of each card, seamless. Keep EVERYTHING else pixel-identical: the same ring of overlapping enamelled wedge cards, the same painted icons inside them, the same gold engraved borders and gems, the same central village diorama, the same painted map background. Do not move, resize or redraw anything else.`);
await page.waitForTimeout(600);
await page.keyboard.press('Enter');
console.log('sent');
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
  if (n === last.n && n > 0) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
console.log('images:', last.n);
const b64 = await page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64);
  const el = els[els.length - 1];
  const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
}, SEL);
fs.writeFileSync(OUT, Buffer.from(b64.data, 'base64'));
console.log('saved', OUT, b64.w + 'x' + b64.h, '| chat:', page.url());
await page.close();
process.exit(0);
