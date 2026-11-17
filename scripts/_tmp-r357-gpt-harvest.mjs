/* R-357: attach to the new ChatGPT conversation, wait until generation ends, harvest full-res images (not the user's attachments). */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261117-r357-eventi-mockup/gen';
mkdirSync(OUT, { recursive: true });
const OLD = ['6afb1d64', '6afc04e1'];
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com\/c\//.test(p.url()) && !OLD.some((o) => p.url().includes(o))) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
console.log('conversation:', page.url());
const pick = () => page.evaluate(() => [...document.querySelectorAll('img')]
  .filter((i) => i.src && !i.closest('[data-message-author-role="user"]'))
  .filter((i) => /blob:|oaiusercontent|chatgpt\.com\/backend|data:image/.test(i.src))
  .filter((i) => i.naturalWidth >= 512 && i.naturalHeight >= 300)
  .map((i) => i.src));
const deadline = Date.now() + 900000;
let urls = [];
while (Date.now() < deadline) {
  const streaming = await page.locator('button[data-testid="stop-button"], button[aria-label*="Stop" i]').count();
  urls = [...new Set(await pick())];
  if (!streaming && urls.length >= 1) { await page.waitForTimeout(5000); urls = [...new Set(await pick())]; break; }
  await page.waitForTimeout(5000);
}
console.log('images:', urls.length);
let k = 0;
for (const u of urls) {
  try {
    const b64 = await page.evaluate(async (src) => {
      const r = await fetch(src); const buf = await r.arrayBuffer();
      let bin = ''; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
      return btoa(bin);
    }, u);
    k += 1; writeFileSync(`${OUT}/full-${k}.png`, Buffer.from(b64, 'base64'));
  } catch (e) { console.log('fetch fail', String(e).slice(0, 100)); }
}
const text = await page.evaluate(() => [...document.querySelectorAll('[data-message-author-role="assistant"]')].map((n) => n.innerText).join('\n---\n'));
writeFileSync(`${OUT}/assistant-text.txt`, text);
console.log('saved', k, 'files; text chars', text.length);
await b.close();
