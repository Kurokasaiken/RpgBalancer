/* Fetch the LAST generated img inside an open Gemini tab via in-page fetch (blob: is same-origin). */
import { chromium } from 'playwright';
import fs from 'node:fs';
const [chatMatch, out] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = browser.contexts()[0].pages().find((p) => p.url().includes(chatMatch));
if (!page) { console.log('tab not found'); process.exit(1); }
const r = await page.evaluate(async () => {
  const imgs = [...document.querySelectorAll('img')].filter((i) => i.src.startsWith('blob:') && i.naturalWidth > 400);
  const el = imgs[imgs.length - 1];
  if (!el) return null;
  const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: el.naturalWidth, h: el.naturalHeight, b64: c.toDataURL('image/png').split(',')[1] };
});
if (!r) { console.log('no blob img'); process.exit(1); }
fs.writeFileSync(out, Buffer.from(r.b64, 'base64'));
console.log('saved', out, r.w + 'x' + r.h);
process.exit(0);
