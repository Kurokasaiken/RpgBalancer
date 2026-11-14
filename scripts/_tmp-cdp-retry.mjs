import { chromium } from 'playwright';
import fs from 'fs';
const CHAT_PREFIX = process.env.CHAT_PREFIX || 'chatgpt.com/c/';
const EXCLUDE = (process.env.EXCLUDE || '').split(',').filter(Boolean);
const SEL = process.env.SEL || 'img';
let browser;
for (let i = 0; i < 20; i++) {
  try { browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 20000 }); break; }
  catch { console.log('retry', i); await new Promise(r => setTimeout(r, 6000)); }
}
if (!browser) { console.error('CDP unreachable'); process.exit(2); }
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes(CHAT_PREFIX) && !EXCLUDE.some(e => p.url().includes(e)));
if (!page) { console.error('tab not found'); process.exit(3); }
console.log('TAB:', page.url());
const data = await page.evaluate((s) => {
  const imgs = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 100)
    .map(e => ({ src: e.src.slice(0, 120), w: e.naturalWidth, h: e.naturalHeight }));
  const tail = document.body.innerText.slice(-1500);
  return { imgs, tail };
}, SEL);
console.log('IMGS:', JSON.stringify(data.imgs, null, 1));
console.log('TAIL:', data.tail.slice(0, 1200));
await browser.close();
