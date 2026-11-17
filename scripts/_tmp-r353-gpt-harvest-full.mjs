/* R-353: harvest full-res — fetch blob: bytes in page context, save PNG. */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261116-r353-cassetto-mockup/gen';
mkdirSync(OUT, { recursive: true });

const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com\/c\//.test(p.url()) && !p.url().includes('6af99fad')) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }

const urls = await page.evaluate(`(() => [...document.querySelectorAll('img')]
  .filter(i => i.src && (i.src.startsWith('blob:') || i.src.includes('oaiusercontent')))
  .filter(i => i.naturalWidth >= 256 && i.naturalHeight >= 256)
  .map(i => i.src))()`);
console.log('urls:', JSON.stringify(urls));

let n = 0;
for (const u of urls) {
  const b64 = await page.evaluate(async (src) => {
    const r = await fetch(src);
    const buf = await r.arrayBuffer();
    let bin = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 32768)
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return btoa(bin);
  }, u);
  n += 1;
  writeFileSync(`${OUT}/full-${n}.png`, Buffer.from(b64, 'base64'));
}
console.log('saved:', n, 'full files');
await b.close();
