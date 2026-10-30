import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('0b99710d00e37e5e')) || ctx.pages()[0];
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
const all = await page.locator('img').all();
const cand = [];
for (const im of all) {
  const w = await im.evaluate(e => e.naturalWidth).catch(()=>0);
  const src = await im.getAttribute('src').catch(()=>'');
  if (w >= 500 && src && /googleusercontent|lh3|blob:/.test(src)) cand.push(im);
}
console.log('generated candidates:', cand.length);
if (cand.length) await cand[cand.length-1].screenshot({ path: 'context/research/2026-10-29-mappa2-sprite-pilot/out/a9-v2-chat2.png' });
await b.close();
