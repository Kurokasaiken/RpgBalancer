import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261115-r348-victory-mockup/gen';
mkdirSync(OUT, { recursive: true });
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com\/c\//.test(p.url())) page = p;
const locs = await page.locator('img').all();
let n = 1; /* gen-1 already saved */
for (const loc of locs) {
  try {
    const src = (await loc.getAttribute('src', { timeout: 500 })) || '';
    if (!(/images\.openai\.com|oaiusercontent|blob:|data:image/.test(src))) continue;
    if (await loc.evaluate(i => i.naturalWidth) < 256) continue;
    /* skip the composer attachment chips (data:image webp thumbs ~small) */
    const box = await loc.boundingBox();
    if (!box || box.width < 200) continue;
    n += 1;
    await loc.screenshot({ path: `${OUT}/gen-${n}.png` });
    console.log('saved gen-' + n + '.png', src.slice(0, 70));
    if (n >= 8) break;
  } catch { /* skip */ }
}
/* also grab the assistant's last message text (variant names) */
const txt = await page.evaluate(() => {
  const arts = [...document.querySelectorAll('[data-message-author-role=assistant], article')];
  const last = arts[arts.length - 1];
  return last ? last.innerText.slice(0, 3000) : '';
});
console.log('---RESPONSE---');
console.log(txt);
await b.close();
