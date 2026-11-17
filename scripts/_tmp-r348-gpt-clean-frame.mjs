/* R-348: ChatGPT web turn via CDP — attach B parchment, ask for clean empty
 * tall version, wait for generation, harvest images to run dir. */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const RUN = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261116-victory-clean-frame';
const OUT = `${RUN}/gen`;
mkdirSync(OUT, { recursive: true });
const PROMPT = readFileSync(`${RUN}/prompt.txt`, 'utf8');
const IMGS = ['/Users/faustoboni/progetti_personali/RPG/public/mockups/victory-reward/ai/B-pergamena-suggellata.png'];

const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
console.log('tab:', page.url().slice(0, 80));

for (const img of IMGS) {
  await page.locator('input[type=file]').first().setInputFiles(img);
  await page.waitForTimeout(3000);
}
const chips = await page.locator('img[src^="data:image"], img[src^="blob:"]').count();
console.log('attached chips:', chips);
if (chips < 1) { console.log('ATTACH_SHORT'); }

const composer = page.locator('[contenteditable=true]').first();
await composer.click();
await page.evaluate((text) => {
  const el = document.querySelector('[contenteditable=true]');
  el.focus();
  document.execCommand('insertText', false, text);
}, PROMPT);
await page.waitForTimeout(800);

const before = await page.locator('img').count();
const send = page.locator('button[data-testid="send-button"], button[aria-label*="Invia" i], button[aria-label*="Send" i]').first();
await send.click();
console.log('sent, waiting for generation…');

const IMG_JS = `() => [...document.querySelectorAll('img')]
  .filter(i => i.src && (i.src.includes('oaiusercontent') || i.src.includes('chatgpt.com/backend') || i.src.startsWith('blob:') || i.src.startsWith('data:image')))
  .filter(i => i.naturalWidth >= 256 && i.naturalHeight >= 256)
  .map(i => i.src.slice(0, 80))`;
let found = [];
const deadline = Date.now() + 360000;
while (Date.now() < deadline) {
  found = await page.evaluate(IMG_JS);
  if (found.length >= 1) {
    const stillStreaming = await page.locator('button[aria-label*="Stop" i], button[data-testid="stop-button"]').count();
    if (!stillStreaming) { await page.waitForTimeout(3000); break; }
  }
  await page.waitForTimeout(3000);
}
console.log('generated imgs found:', found.length, JSON.stringify(found));

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
await b.close();
