import { chromium } from 'playwright';
import fs from 'fs';
const CHAT = '685d5d8b80949fcf';
const DIR = '.mw/specs/poi-radial/cards/gen/';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const page = browser.contexts()[0].pages().find(p => p.url().includes(CHAT));
if (!page) { console.error('no chat'); process.exit(3); }
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
const imgCount = () => page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
// attach
let ok = false;
for (let a = 0; a < 4 && !ok; a++) {
  await page.locator('button[aria-label="Caricamento e strumenti"]').first().click({ noWaitAfter: true, force: true }).catch(() => {});
  await page.waitForTimeout(3000);
  const it = page.locator('button:has-text("Carica file")').first();
  if (await it.count() === 0) { console.log('attempt', a, 'no Carica file'); await page.keyboard.press('Escape'); await page.waitForTimeout(1500); continue; }
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }),
      it.click({ noWaitAfter: true }),
    ]);
    await chooser.setFiles(DIR + 'plate-emerald-c0.png');
    ok = true;
  } catch { console.log('attempt', a, 'chooser fail'); await page.keyboard.press('Escape'); await page.waitForTimeout(1500); }
}
if (!ok) { await page.screenshot({ path: DIR + 'attach-fail.png' }); process.exit(4); }
console.log('attached');
await page.waitForTimeout(3500);
await page.evaluate((txt) => {
  const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
  ed.focus(); document.execCommand('insertText', false, txt);
}, `Edit this image: the EXACT same trapezoidal fan card — same shape, same thick engraved antique-gold border, same filigree with engraved leaves, same gems in the same positions — but change the enamel field to a dark charcoal-navy smoked enamel, almost black, like an empty unused socket; in the very centre of the enamel field add a single small engraved antique-gold upward-pointing triangle. Same painterly impasto style, same flat deep dark navy background, no text.`);
await page.waitForTimeout(600);
await page.keyboard.press('Enter');
console.log('sent');
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await imgCount();
  if (n === last.n && n >= 4) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
const b64 = await page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64);
  const el = els[els.length - 1];
  const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
}, SEL);
fs.writeFileSync(DIR + 'plate-empty.png', Buffer.from(b64.data, 'base64'));
console.log('saved plate-empty.png', b64.w + 'x' + b64.h);
process.exit(0);
