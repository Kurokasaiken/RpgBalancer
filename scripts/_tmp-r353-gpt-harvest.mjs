/* R-353: harvest-only — the prompt was already sent by _tmp-r353-gpt-turn.mjs
 * before its evaluate bug. Wait for generated images in the fresh /c/ tab. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261116-r353-cassetto-mockup/gen';
mkdirSync(OUT, { recursive: true });

const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com\/c\//.test(p.url()) && !p.url().includes('6af99fad')) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
console.log('tab:', page.url().slice(0, 80));

const IMG_JS = `(() => [...document.querySelectorAll('img')]
  .filter(i => i.src && (i.src.includes('oaiusercontent') || i.src.includes('chatgpt.com/backend') || i.src.startsWith('blob:') || i.src.startsWith('data:image')))
  .filter(i => i.naturalWidth >= 256 && i.naturalHeight >= 256)
  .map(i => i.src.slice(0, 80)))()`;

let found = [];
const deadline = Date.now() + 360000;
while (Date.now() < deadline) {
  found = await page.evaluate(IMG_JS);
  if (found.length >= 1) {
    const stillStreaming = await page.locator('button[aria-label*="Stop" i], button[data-testid="stop-button"]').count();
    if (!stillStreaming) { await page.waitForTimeout(4000); break; }
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
