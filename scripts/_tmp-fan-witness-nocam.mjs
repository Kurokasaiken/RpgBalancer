import { chromium } from 'playwright';
const b = await chromium.launch({ timeout: 120000 });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const t0 = Date.now();
await p.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded', timeout: 180000 });
console.error('nav', Math.round((Date.now() - t0) / 1000));
for (let i = 0; i < 60; i++) {
  const n = await p.locator('[data-testid="place-village-hit"]').count().catch(() => 0);
  if (n) break;
  await p.waitForTimeout(5000);
}
const expanded = await p.locator('[data-testid="place-village-hit"]').getAttribute('aria-expanded').catch(() => null);
console.error('hit expanded=', expanded, 't=', Math.round((Date.now() - t0) / 1000));
if (expanded !== 'true') await p.locator('[data-testid="place-village-hit"]').dispatchEvent('click');
await p.waitForSelector('[data-testid="place-fancards"]', { timeout: 60000 });
const info = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="place-fancards"]');
  const l = el.style.left, t = el.style.top;
  document.body.appendChild(el);
  el.style.position = 'fixed';
  el.style.left = `calc(50% + ${l})`;
  el.style.top = `calc(50% + ${t})`;
  el.style.zIndex = '9999';
  return { l, t };
});
console.error('repo', JSON.stringify(info));
await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/fan-witness-nocam.png' });
console.error('done', Math.round((Date.now() - t0) / 1000));
await b.close();
