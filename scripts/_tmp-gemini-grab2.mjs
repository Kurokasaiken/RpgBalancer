import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('gemini.google.com/app/39b93234'));
if (!page) { console.error('tab not found'); process.exit(1); }
const imgs = page.locator('MODEL-RESPONSE img, model-response img');
const n = await imgs.count();
console.log('response imgs:', n);
for (let i = 0; i < n; i++) {
  const el = imgs.nth(i);
  const w = await el.evaluate(e => e.naturalWidth);
  if (w < 64) continue;
  await el.screenshot({ path: `test-results/slicekit/frame-smeraldo/stash-interior/gen/resp-img-${i}.png` });
  console.log('saved resp-img-' + i + '.png', w + 'px');
}
// also all big imgs for safety
const all = page.locator('img');
const m = await all.count();
let j = 0;
for (let i = 0; i < m; i++) {
  const el = all.nth(i);
  const w = await el.evaluate(e => e.naturalWidth).catch(() => 0);
  const src = await el.evaluate(e => e.src).catch(() => '');
  if (w > 200 && !src.includes('gstatic') && !src.includes('googleusercontent.com/a/')) {
    await el.screenshot({ path: `test-results/slicekit/frame-smeraldo/stash-interior/gen/big-${j}.png` });
    console.log('saved big-' + j + '.png', w, src.slice(0, 50));
    j++;
  }
}
process.exit(0);
