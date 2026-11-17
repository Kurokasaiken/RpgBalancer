import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/gemini\.google\.com/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
const b64 = await page.evaluate(async () => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.naturalWidth >= 400);
  const img = imgs.sort((a, b) => b.naturalWidth - a.naturalWidth)[0];
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return c.toDataURL('image/png').split(',')[1];
});
writeFileSync('.mw/runs/20261116-victory-clean-frame/gen/B-gemini-clean.png', Buffer.from(b64, 'base64'));
console.log('saved');
await b.close();
