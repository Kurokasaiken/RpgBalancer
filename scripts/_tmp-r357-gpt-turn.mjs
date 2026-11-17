/* R-357 (from R-353/R-348): one-shot ChatGPT web turn via CDP (background) — attach witness
 * images, send mockup prompt, wait for generated images, harvest to run dir. */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const RUN = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261117-r357-eventi-mockup';
const OUT = `${RUN}/gen`;
mkdirSync(OUT, { recursive: true });
const PROMPT = readFileSync(`${RUN}/prompt.txt`, 'utf8');
const IMGS = [`/Users/faustoboni/progetti_personali/RPG/.mw/specs/expedition-ui/refs/mockup-chatgpt.png`, `/Users/faustoboni/progetti_personali/RPG/.mw/specs/expedition-ui/refs/mockup-cassetto-v2.png`];

const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (p.url() === 'https://chatgpt.com/' || /chatgpt\.com\/$/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
console.log('tab:', page.url().slice(0, 80));

/* attach both witness images to the composer file input */
for (const img of IMGS) {
  await page.locator('input[type=file]').first().setInputFiles(img);
  await page.waitForTimeout(3000);
}
const chips = await page.locator('img[src^="data:image"], img[src^="blob:"]').count();
console.log('attached chips:', chips);
if (chips < 2) { console.log('ATTACH_SHORT'); }

/* paste prompt into composer (fill via clipboard-style insert) */
const composer = page.locator('[contenteditable=true]').first();
await composer.click();
await page.evaluate((text) => {
  const el = document.querySelector('[contenteditable=true]');
  el.focus();
  document.execCommand('insertText', false, text);
}, PROMPT);
await page.waitForTimeout(800);

/* count existing model turns so we can detect the new one */
const before = await page.locator('[data-message-author-role=assistant], article').count();
const send = page.locator('button[data-testid="send-button"], button[aria-label*="Invia" i], button[aria-label*="Send" i]').first();
await send.click();
console.log('sent, waiting for generation…');
await page.waitForTimeout(20000);

/* generation is async: poll for response images (oaiusercontent/blob/data,
 * natural >=256px) for up to 6 minutes */
const IMG_JS = `() => [...document.querySelectorAll('img')]
  .filter(i => i.src && (i.src.includes('oaiusercontent') || i.src.includes('chatgpt.com/backend') || i.src.startsWith('blob:') || i.src.startsWith('data:image')))
  .filter(i => i.naturalWidth >= 256 && i.naturalHeight >= 256)
  .map(i => i.src.slice(0, 80))`;
let found = [];
const deadline = Date.now() + 900000;
while (Date.now() < deadline) {
  found = await page.evaluate(IMG_JS);
  /* stop early when streaming finished: send-button back + images stable */
  if (found.length >= 1 && await page.locator('button[data-testid="send-button"], button[aria-label*="Stop" i]').count() >= 0) {
    const stillStreaming = await page.locator('button[aria-label*="Stop" i], button[data-testid="stop-button"]').count();
    if (!stillStreaming) { await page.waitForTimeout(3000); break; }
  }
  await page.waitForTimeout(3000);
}
console.log('generated imgs found:', found.length, JSON.stringify(found));

/* harvest: element screenshots are always capturable */
const locs = await page.locator('img').all();
let n = 0;
for (const loc of locs) {
  try {
    const src = (await loc.getAttribute('src', { timeout: 500 })) || '';
    if (!(/oaiusercontent|backend|blob:|data:image/.test(src))) continue;
    if (await loc.evaluate(i => i.naturalWidth) < 256) continue;
    n += 1;
    await loc.screenshot({ path: `${OUT}/gen-${n}.png` });
    if (n >= 8) break;
  } catch { /* skip */ }
}
console.log('saved:', n, 'files in', OUT);
console.log('conversation:', page.url());
/* full-res harvest from the same page (R-353 harvest-full logic) */
const urls = await page.evaluate(`(() => [...document.querySelectorAll('img')]
  .filter(i => i.src && (i.src.startsWith('blob:') || i.src.includes('oaiusercontent') || i.src.includes('chatgpt.com/backend')))
  .filter(i => i.naturalWidth >= 256 && i.naturalHeight >= 256)
  .map(i => i.src))()`);
let k = 0;
for (const u of [...new Set(urls)]) {
  try {
    const b64 = await page.evaluate(async (src) => {
      const r = await fetch(src); const buf = await r.arrayBuffer();
      let bin = ''; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
      return btoa(bin);
    }, u);
    k += 1; writeFileSync(`${OUT}/full-${k}.png`, Buffer.from(b64, 'base64'));
  } catch (e) { console.log('fetch fail', String(e).slice(0, 80)); }
}
console.log('full-res saved:', k);
await b.close();
