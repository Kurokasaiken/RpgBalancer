/* Follow-up in an existing Gemini chat: node _tmp-gemini-follow2.mjs <chatId> <promptFile> */
import { chromium } from 'playwright';
import fs from 'node:fs';
const [chatId, promptFile] = process.argv.slice(2);
const PROMPT = fs.readFileSync(promptFile, 'utf8');
const b = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 150000 });
const ctx = b.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes(chatId));
if (!page) { console.log('tab gone', chatId); process.exit(1); }
const base = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.naturalWidth > 400 && i.src.startsWith('blob:')).length);
await page.evaluate((t) => {
  const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
  ed.focus(); document.execCommand('insertText', false, t);
}, PROMPT);
await page.keyboard.press('Enter');
console.log('follow-up sent, base imgs', base);
let stable = 0, done = false;
for (let i = 0; i < 80 && !done; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  const imgs = await page.evaluate(() =>
    [...document.querySelectorAll('img')].map((im) => ({ s: im.src, w: im.naturalWidth })).filter((x) => x.w > 400 && x.s.startsWith('blob:')));
  if (imgs.length > base) { if (++stable >= 3) done = true; } else stable = 0;
}
if (!done) { console.log('NO NEW IMAGE'); process.exit(1); }
const dataUrl = await page.evaluate(() => {
  const ims = [...document.querySelectorAll('img')].filter((i) => i.naturalWidth > 400 && i.src.startsWith('blob:'));
  const im = ims[ims.length - 1];
  const c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  c.getContext('2d').drawImage(im, 0, 0);
  return c.toDataURL('image/png');
});
fs.writeSync(1, 'DATAURL:' + dataUrl + '\n');
process.exit(0);
