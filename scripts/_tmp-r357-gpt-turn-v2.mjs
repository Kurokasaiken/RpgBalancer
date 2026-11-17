/* R-357 v2: new ChatGPT chat in our own tab, attach ref, send prompt, wait for an ASSISTANT image, save full-res. */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const RUN = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261117-r357-eventi-mockup-v2';
const OUT = `${RUN}/gen`; mkdirSync(OUT, { recursive: true });
const PROMPT = readFileSync(`${RUN}/prompt.txt`, 'utf8');
const IMGS = [`${RUN}/ref-roster-panel.png`];
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages()) if (p.url().includes('6afc1a5b')) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
await page.goto('https://chatgpt.com/'); await page.waitForTimeout(6000);
for (const img of IMGS) { await page.locator('input[type=file]').first().setInputFiles(img); await page.waitForTimeout(4000); }
await page.evaluate((text) => { const el = document.querySelector('[contenteditable=true]'); el.focus(); document.execCommand('insertText', false, text); }, PROMPT);
await page.waitForTimeout(1000);
await page.locator('button[data-testid="send-button"]').first().click();
console.log('sent'); await page.waitForTimeout(20000);
const pick = () => page.evaluate(() => [...document.querySelectorAll('img')]
  .filter((i) => i.src && !i.closest('[data-message-author-role="user"]'))
  .filter((i) => /blob:|oaiusercontent|chatgpt\.com\/backend/.test(i.src))
  .filter((i) => i.naturalWidth >= 512 && i.naturalHeight >= 512).map((i) => i.src));
let urls = []; const deadline = Date.now() + 900000;
while (Date.now() < deadline) {
  const streaming = await page.locator('button[data-testid="stop-button"]').count();
  urls = [...new Set(await pick())];
  if (!streaming && urls.length) { await page.waitForTimeout(8000); urls = [...new Set(await pick())]; break; }
  await page.waitForTimeout(5000);
}
console.log('conversation:', page.url(), 'images:', urls.length);
let k = 0;
for (const u of urls) {
  const b64 = await page.evaluate(async (src) => { const r = await fetch(src); const buf = new Uint8Array(await r.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(s); }, u);
  k += 1; writeFileSync(`${OUT}/full-${k}.png`, Buffer.from(b64, 'base64'));
}
console.log('saved', k); await b.close();
