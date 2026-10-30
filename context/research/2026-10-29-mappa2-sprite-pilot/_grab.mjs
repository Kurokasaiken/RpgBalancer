import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('0b99710d00e37e5e')) || ctx.pages()[0];
// ultima immagine generata nella chat
const imgs = await page.locator('img[src*="googleusercontent"], img[src*="lh3"], generated-image img, img.generated').all();
console.log('imgs found:', imgs.length);
const urls = await page.evaluate(() => {
  const s = new Set();
  document.querySelectorAll('img').forEach(i => { if (i.src && /googleusercontent|lh3/.test(i.src) && i.naturalWidth > 200) s.add(i.src); });
  return [...s].slice(-4);
});
console.log(JSON.stringify(urls, null, 1));
if (urls.length) {
  const buf = await page.evaluate(async (u) => {
    const r = await fetch(u); const b = await r.blob();
    return [...new Uint8Array(await b.arrayBuffer())];
  }, urls[urls.length-1]);
  fs.writeFileSync('context/research/2026-10-29-mappa2-sprite-pilot/out/a9-v2-chat.png', Buffer.from(buf));
  console.log('saved a9-v2-chat.png');
}
await b.close();
