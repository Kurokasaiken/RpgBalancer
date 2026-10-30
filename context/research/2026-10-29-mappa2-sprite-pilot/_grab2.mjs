import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('0b99710d00e37e5e')) || ctx.pages()[0];
const imgs = page.locator('img').filter({ hasNot: page.locator('xpath=..//*[@aria-label]') });
const all = await page.locator('img').all();
let best = null, bestW = 0;
for (const im of all) {
  const w = await im.evaluate(e => e.naturalWidth).catch(()=>0);
  const src = await im.getAttribute('src').catch(()=>'');
  if (w > bestW && src && /googleusercontent|lh3|blob:/.test(src)) { bestW = w; best = im; }
}
console.log('largest generated img naturalWidth:', bestW);
if (best) await best.screenshot({ path: 'context/research/2026-10-29-mappa2-sprite-pilot/out/a9-v2-chat.png' });
await b.close();
