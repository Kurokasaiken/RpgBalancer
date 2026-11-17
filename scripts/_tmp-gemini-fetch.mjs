import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/gemini\.google\.com/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
const srcs = await page.evaluate(() => [...document.querySelectorAll('img')]
  .filter(i => i.naturalWidth >= 400)
  .map(i => ({ src: i.src.slice(0, 140), w: i.naturalWidth, h: i.naturalHeight })));
console.log(JSON.stringify(srcs, null, 1));
/* fetch the biggest one as bytes */
const res = await page.evaluate(async () => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.naturalWidth >= 400);
  if (!imgs.length) return null;
  const img = imgs.sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight)[0];
  const r = await fetch(img.src);
  const buf = await r.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return { mime: r.headers.get('content-type'), len: buf.byteLength, b64 };
});
if (res) {
  writeFileSync('.mw/runs/20261116-victory-clean-frame/gen/B-gemini-clean-raw', Buffer.from(res.b64, 'base64'));
  console.log('saved raw:', res.mime, res.len, 'bytes');
}
await b.close();
