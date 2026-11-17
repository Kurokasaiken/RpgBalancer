/* R-357 v3 harvest: wait until the conversation holds >=2 distinct large images (attachment + generated), not streaming; save all. */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261117-r357-eventi-mockup-v3/gen';
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages()) if (p.url().includes('6afc1d8d')) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
const pick = () => page.evaluate(() => [...document.querySelectorAll('img')]
  .filter((i) => /blob:|oaiusercontent|chatgpt\.com\/backend/.test(i.src || ''))
  .filter((i) => i.naturalWidth >= 512 && i.naturalHeight >= 400).map((i) => i.src));
let urls = []; const deadline = Date.now() + 900000;
while (Date.now() < deadline) {
  const streaming = await page.locator('button[data-testid="stop-button"], button[aria-label*="Stop" i]').count();
  urls = [...new Set(await pick())];
  if (!streaming && urls.length >= 2) { await page.waitForTimeout(8000); urls = [...new Set(await pick())]; break; }
  await page.waitForTimeout(6000);
}
console.log('distinct images:', urls.length);
let k = 0;
for (const u of urls) {
  const b64 = await page.evaluate(async (src) => { const r = await fetch(src); const buf = new Uint8Array(await r.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(s); }, u);
  k += 1; writeFileSync(`${OUT}/cand-${k}.png`, Buffer.from(b64, 'base64'));
}
const txt = await page.evaluate(() => document.querySelector('main')?.innerText?.slice(-1500) || '');
writeFileSync(`${OUT}/page-tail.txt`, txt);
console.log('saved', k); await b.close();
