/* waits for a generated image inside an ASSISTANT message (not attachments), saves it full-size */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const [CHAT, OUT] = process.argv.slice(2);
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null; for (const ctx of b.contexts()) for (const p of ctx.pages()) if (p.url().includes(CHAT)) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
const pick = () => page.evaluate(() => [...document.querySelectorAll('[data-message-author-role="assistant"] img, [data-testid*="image" i] img')].filter((i) => i.naturalWidth >= 700).map((i) => i.src));
let urls = []; const deadline = Date.now() + 1200000;
while (Date.now() < deadline) {
  const streaming = await page.locator('button[data-testid="stop-button"], button[aria-label*="Stop" i]').count();
  urls = [...new Set(await pick())];
  const txt = await page.evaluate(() => document.querySelector('main')?.innerText.slice(-400) || '');
  if (!streaming && urls.length) { await page.waitForTimeout(8000); urls = [...new Set(await pick())]; break; }
  if (!streaming && /limite|limit/i.test(txt)) { console.log('LIMIT:', txt.replace(/\n/g, ' ')); break; }
  await page.waitForTimeout(8000);
}
console.log('images', urls.length);
let k = 0; for (const u of urls) { const b64 = await page.evaluate(async (s) => { const r = await fetch(s); const buf = new Uint8Array(await r.arrayBuffer()); let o = ''; for (let i = 0; i < buf.length; i += 32768) o += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(o); }, u); k++; writeFileSync(`${OUT}/gen-${k}.png`, Buffer.from(b64, 'base64')); }
await page.screenshot({ path: `${OUT}/response.png` }); console.log('saved', k); await b.close();
