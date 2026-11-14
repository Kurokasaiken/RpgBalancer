#!/usr/bin/env node
// F2-T2: amethyst (attachment already pending) then empty (menu attach).
import { chromium } from 'playwright';
import fs from 'fs';
const CHAT = '685d5d8b80949fcf';
const DIR = '.mw/specs/poi-radial/cards/gen/';
const SRC = DIR + 'plate-emerald-c0.png';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const page = browser.contexts()[0].pages().find(p => p.url().includes(CHAT));
if (!page) { console.error('chat tab gone'); process.exit(3); }
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
const imgCount = () => page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
const send = async (prompt) => {
  await page.evaluate((txt) => {
    const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
    ed.focus(); document.execCommand('insertText', false, txt);
  }, prompt);
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
};
const waitImg = async (expect) => {
  let last = { n: expect - 1, stable: 0 };
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    const n = await imgCount();
    if (n === last.n && n >= expect) { if (++last.stable >= 4) return n; } else last = { n, stable: 0 };
    await page.waitForTimeout(2500);
  }
  return last.n;
};
const grab = async (out) => {
  const b64 = await page.evaluate((s) => {
    const els = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64);
    const el = els[els.length - 1];
    const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
    c.getContext('2d').drawImage(el, 0, 0);
    return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
  }, SEL);
  fs.writeFileSync(DIR + out, Buffer.from(b64.data, 'base64'));
  console.log('saved', out, b64.w + 'x' + b64.h);
};
const attachViaMenu = async () => {
  for (let a = 0; a < 3; a++) {
    await page.locator('button[aria-label="Caricamento e strumenti"]').first().click({ noWaitAfter: true }).catch(() => {});
    try {
      const it = page.locator('button:has-text("Carica file")').first();
      await it.waitFor({ state: 'visible', timeout: 5000 });
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }),
        it.click({ noWaitAfter: true }),
      ]);
      await chooser.setFiles(SRC);
      await page.waitForTimeout(3000);
      return;
    } catch (e) {
      console.log('attach attempt', a, 'failed');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1500);
    }
  }
  throw new Error('attach failed');
};

// step 2: empty plate — fresh attach via menu
await attachViaMenu();
await send(`Edit this image: the EXACT same trapezoidal fan card — same shape, same thick engraved antique-gold border, same filigree with engraved leaves, same gems in the same positions — but change the enamel field to a dark charcoal-navy smoked enamel, almost black, like an empty unused socket; in the very centre of the enamel field add a single small engraved antique-gold upward-pointing triangle. Same painterly impasto style, same flat deep dark navy background, no text.`);
console.log('empty sent; images now:', await imgCount());
await waitImg(4);
await grab('plate-empty.png');
process.exit(0);
