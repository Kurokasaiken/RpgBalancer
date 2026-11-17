import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const b = await chromium.connectOverCDP('http://localhost:9222');
for (const ctx of b.contexts()) for (const p of ctx.pages()) {
  if (!/chatgpt\.com\/c\//.test(p.url())) continue;
  const srcs = await p.evaluate(() => [...document.querySelectorAll('img')]
    .filter(i => i.src?.startsWith('blob:') && i.naturalWidth >= 512)
    .map(i => i.src));
  for (const [k, src] of srcs.entries()) {
    const b64 = await p.evaluate(async (u) => {
      const r = await fetch(u); const b = await r.blob();
      const ab = await b.arrayBuffer();
      let s = ''; const bytes = new Uint8Array(ab);
      for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode(...bytes.subarray(i, i + 32768));
      return btoa(s);
    }, src);
    const out = `/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261115-r348-victory-mockup/gen/full-${k + 1}.png`;
    writeFileSync(out, Buffer.from(b64, 'base64'));
    console.log('saved', out, Math.round(b64.length * 0.75 / 1024), 'KB');
  }
}
await b.close();
