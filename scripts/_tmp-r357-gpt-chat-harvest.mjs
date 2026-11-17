/* R-357: harvest every image of a given ChatGPT conversation (reuses an existing background tab). */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const URL_ = process.argv[2]; const OUT = process.argv[3]; const TAB = process.argv[4];
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages()) if (p.url().includes(TAB)) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
// scroll the thread top->bottom to trigger lazy images
for (let pass = 0; pass < 2; pass++) {
  await page.evaluate(async () => {
    const sc = [...document.querySelectorAll('main *')].find((e) => e.scrollHeight > e.clientHeight + 200 && /auto|scroll/.test(getComputedStyle(e).overflowY));
    if (!sc) return; sc.scrollTop = 0; await new Promise((r) => setTimeout(r, 1500));
    for (let y = 0; y <= sc.scrollHeight; y += 600) { sc.scrollTop = y; await new Promise((r) => setTimeout(r, 400)); }
  });
}
const urls = await page.evaluate(() => [...new Set([...document.querySelectorAll('img')]
  .filter((i) => i.naturalWidth >= 400 && i.naturalHeight >= 300).map((i) => i.src))]);
console.log('images:', urls.length);
let k = 0;
for (const u of urls) {
  try {
    const b64 = await page.evaluate(async (src) => { const r = await fetch(src); const buf = new Uint8Array(await r.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(s); }, u);
    k += 1; writeFileSync(`${OUT}/img-${String(k).padStart(2, '0')}.png`, Buffer.from(b64, 'base64'));
  } catch (e) { console.log('fail', u.slice(0, 80), e.message); }
}
const txt = await page.evaluate(() => [...document.querySelectorAll('[data-message-author-role]')].map((m) => `### ${m.getAttribute('data-message-author-role')}\n${m.innerText}`).join('\n\n'));
writeFileSync(`${OUT}/thread.txt`, txt);
console.log('saved', k, 'title:', await page.title()); await b.close();
