#!/usr/bin/env node
// F2-T2: family variants + empty plate — reuse the already-open chat tab.
import { chromium } from 'playwright';
import fs from 'fs';
const CHAT = '685d5d8b80949fcf';
const DIR = '.mw/specs/poi-radial/cards/gen/';
const SRC = DIR + 'plate-emerald-c0.png';
const STEPS = [
  { out: 'plate-amethyst.png', expect: 3,
    prompt: `Edit this image: the EXACT same trapezoidal fan card — same shape, same thick engraved antique-gold border, same filigree with engraved leaves, same gems in the same positions — but change the enamel field to a deep AMETHYST VIOLET vitreous enamel with subtle darker veins and the same soft inner glow. Keep it empty in the centre, same painterly impasto style, same flat deep dark navy background, no text.` },
  { out: 'plate-empty.png', expect: 4,
    prompt: `Edit this image: the EXACT same trapezoidal fan card — same shape, same thick engraved antique-gold border, same filigree with engraved leaves, same gems in the same positions — but change the enamel field to a dark charcoal-navy smoked enamel, almost black, like an empty unused socket; in the very centre of the enamel field add a single small engraved antique-gold upward-pointing triangle. Same painterly impasto style, same flat deep dark navy background, no text.` },
];
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
let page = ctx.pages().find(p => p.url().includes(CHAT));
if (!page) {
  const cdp = await browser.newBrowserCDPSession();
  await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
  for (let i = 0; i < 120; i++) { page = ctx.pages().find(p => p.url() === 'about:blank'); if (page) break; await new Promise(r => setTimeout(r, 250)); }
  if (!page) { console.error('no bg tab'); process.exit(3); }
  await page.goto('https://gemini.google.com/app/' + CHAT, { waitUntil: 'domcontentloaded', timeout: 60000 });
}
console.log('on chat:', page.url());
// poll editor via evaluate — resilient to visibility flakes
let editorOk = false;
for (let i = 0; i < 60 && !editorOk; i++) {
  editorOk = await page.evaluate(() => !!document.querySelector('.ql-editor, div[contenteditable="true"]'));
  if (!editorOk) await page.waitForTimeout(2000);
}
if (!editorOk) { console.error('no editor'); process.exit(6); }
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
for (const st of STEPS) {
  // attach: ensure file inputs exist (open upload menu if needed)
  let attached = false;
  for (let t = 0; t < 4 && !attached; t++) {
    const nIn = await page.evaluate(() => document.querySelectorAll('input[type="file"]').length);
    if (nIn === 0) {
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(e => /caricamento|upload|allega|aggiungi/i.test(e.getAttribute('aria-label') || ''));
        b?.click();
      });
      await page.waitForTimeout(2500);
    }
    const fis = page.locator('input[type="file"]');
    for (let i = 0; i < await fis.count(); i++) {
      const accept = (await fis.nth(i).getAttribute('accept')) || '';
      if (accept && !/image|\*/.test(accept)) continue;
      try { await fis.nth(i).setInputFiles(SRC); attached = true; break; } catch {}
    }
  }
  console.log('attached:', attached, '->', st.out);
  if (!attached) process.exit(4);
  await page.waitForTimeout(3000);
  await page.evaluate((txt) => {
    const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
    ed.focus(); ed.textContent = '';
    document.execCommand('insertText', false, txt);
  }, st.prompt);
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  console.log('sent ->', st.out);
  let last = { n: st.expect - 1, stable: 0 };
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
    if (n === last.n && n >= st.expect) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
    await page.waitForTimeout(2500);
  }
  const b64 = await page.evaluate((s) => {
    const els = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64);
    const el = els[els.length - 1];
    const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
    c.getContext('2d').drawImage(el, 0, 0);
    return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
  }, SEL);
  fs.writeFileSync(DIR + st.out, Buffer.from(b64.data, 'base64'));
  console.log('saved', st.out, b64.w + 'x' + b64.h);
}
process.exit(0);
