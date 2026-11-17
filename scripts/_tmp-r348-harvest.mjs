import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261115-r348-victory-mockup/gen';
mkdirSync(OUT, { recursive: true });
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com\/c\//.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
const deadline = Date.now() + 300000;
let lastLen = -1, stable = 0;
while (Date.now() < deadline) {
  let streaming = true;
  try {
    streaming = await page.locator('button[data-testid="stop-button"], button[aria-label*="Stop" i], button[aria-label*="interrompi" i]').count() > 0;
  } catch {}
  if (!streaming) { stable++; if (stable >= 3) break; } else stable = 0;
  await page.waitForTimeout(3000);
}
/* dump assistant imgs */
const imgs = await page.evaluate(() => [...document.querySelectorAll('img')]
  .filter(i => i.src && i.naturalWidth >= 256 && i.naturalHeight >= 256)
  .map(i => ({src: i.src.slice(0, 100), w: i.naturalWidth, h: i.naturalHeight})));
console.log('imgs:', JSON.stringify(imgs, null, 1).slice(0, 3000));
const locs = await page.locator('img').all();
let n = 0;
for (const loc of locs) {
  try {
    const src = (await loc.getAttribute('src', { timeout: 500 })) || '';
    if (!(/oaiusercontent|backend|blob:|data:image/.test(src))) continue;
    if (await loc.evaluate(i => i.naturalWidth) < 256) continue;
    n += 1;
    await loc.screenshot({ path: `${OUT}/gen-${n}.png` });
    console.log('saved gen-' + n + '.png', src.slice(0, 60));
    if (n >= 8) break;
  } catch { /* skip */ }
}
await b.close();
