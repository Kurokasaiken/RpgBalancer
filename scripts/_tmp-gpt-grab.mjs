import { chromium } from 'playwright';
import fs from 'fs';
let browser;
for (let i = 0; i < 60; i++) {
  try { browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 20000 }); break; }
  catch { await new Promise(r => setTimeout(r, 8000)); }
}
if (!browser) { console.error('CDP unreachable'); process.exit(2); }
const ctx = browser.contexts()[0];
const pages = ctx.pages().filter(p => p.url().includes('chatgpt.com'));
for (const p of pages) console.log('GPT:', p.url());
const page = pages.find(p => !/6af789be|6af8105b|6af822f3/.test(p.url()) && p.url().includes('/c/'));
if (!page) { console.log('no new chat tab'); process.exit(3); }
const data = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(e => e.naturalWidth > 100 && /oaiusercontent|dalle|generated/i.test(e.src + e.alt));
  return imgs.map(e => e.src);
});
console.log('generated imgs:', data.length);
if (data.length) {
  // download last image via fetch in page
  const b64 = await page.evaluate(async (url) => {
    const r = await fetch(url); const b = await r.blob();
    const buf = await b.arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(buf.slice(0, 4000000))));
  }, data[data.length-1]).catch(() => null);
  if (b64) { fs.writeFileSync('.mw/specs/poi-radial/gen/mockup-detext.png', Buffer.from(b64, 'base64')); console.log('SAVED'); }
}
await browser.close();
