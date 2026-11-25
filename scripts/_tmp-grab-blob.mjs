import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('gemini.google.com'));
if (!page) { console.log('no gemini page'); process.exit(1); }
const src = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter((im) => im.naturalWidth > 400);
  imgs.sort((a, b) => b.naturalWidth - a.naturalWidth);
  return imgs[0]?.src ?? null;
});
console.log('src:', src?.slice(0, 80));
const dataUrl = await page.evaluate(async (s) => {
  const r = await fetch(s); const blob = await r.blob();
  return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
}, src);
const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
fs.writeFileSync(process.argv[2], buf);
console.log('saved', buf.length, 'bytes');
process.exit(0);
