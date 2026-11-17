import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/chatgpt\.com\/c\//.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
const imgs = await page.evaluate(() => [...document.querySelectorAll('img')]
  .filter(i => i.src && (i.src.includes('oaiusercontent') || i.src.startsWith('blob:') || i.src.startsWith('data:image')))
  .map(i => ({ src: i.src.slice(0, 90), w: i.naturalWidth, h: i.naturalHeight })));
console.log('img candidates:', JSON.stringify(imgs, null, 1));
const lastMsg = await page.evaluate(() => {
  const arts = [...document.querySelectorAll('[data-message-author-role=assistant], article')];
  const last = arts[arts.length - 1];
  return last ? last.textContent.slice(0, 400) : 'none';
});
console.log('last assistant msg:', lastMsg);
const locs = await page.locator('img').all();
let n = 0;
for (const loc of locs) {
  try {
    const src = (await loc.getAttribute('src', { timeout: 500 })) || '';
    if (!(/oaiusercontent|backend|blob:|data:image/.test(src))) continue;
    if (await loc.evaluate(i => i.naturalWidth) < 256) continue;
    n += 1;
    await loc.screenshot({ path: `.mw/runs/20261116-victory-clean-frame/gen/gen-${n}.png` });
  } catch { /* skip */ }
}
console.log('saved:', n);
await b.close();
