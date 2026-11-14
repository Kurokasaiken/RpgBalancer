import { chromium } from 'playwright';
import fs from 'fs';
const CHAT = '7fcc79307197c38f';
const OUT = '.mw/specs/poi-radial/gen/mockup-detext.png';
const PROMPT = `Now please GENERATE and OUTPUT the edited image itself (create image), applying that edit: the same image with all card text labels removed and replaced by the surrounding painted enamel texture. Output the image, not a description.`;
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes(CHAT));
if (!page) { console.error('tab gone'); process.exit(3); }
await page.evaluate((txt) => {
  const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
  ed.focus(); ed.textContent = '';
  document.execCommand('insertText', false, txt);
}, PROMPT);
await page.waitForTimeout(600);
await page.keyboard.press('Enter');
console.log('sent');
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
  if (n === last.n && n >= 1) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
console.log('imgs:', last.n);
if (last.n < 1) { const t = await page.evaluate(() => { const r=[...document.querySelectorAll('model-response')]; return (r.slice(-1)[0]?.innerText||'').slice(0,400); }); console.log('RESP:', t); process.exit(5); }
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
