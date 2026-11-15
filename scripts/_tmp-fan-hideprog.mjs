import { chromium } from 'playwright';
const b = await chromium.launch({ timeout: 120000 });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded', timeout: 180000 });
for (let i = 0; i < 60; i++) {
  if (await p.locator('[data-testid="place-village-hit"]').count().catch(() => 0)) break;
  await p.waitForTimeout(5000);
}
const expanded = await p.locator('[data-testid="place-village-hit"]').getAttribute('aria-expanded').catch(() => null);
if (expanded !== 'true') await p.locator('[data-testid="place-village-hit"]').dispatchEvent('click');
await p.waitForSelector('[data-testid="place-fancards"]', { timeout: 60000 });
const n = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="place-fancards"]');
  const l = el.style.left, t = el.style.top;
  document.body.appendChild(el);
  el.style.position = 'fixed';
  el.style.left = `calc(50% + ${l})`;
  el.style.top = `calc(50% + ${t})`;
  el.style.zIndex = '9999';
  // hide progress/done overlays (familyDark fill, opacity .72)
  const paths = [...el.querySelectorAll('path')].filter(x => x.getAttribute('opacity') === '0.72');
  paths.forEach(x => x.style.display = 'none');
  return paths.length;
});
console.error('hidden prog paths:', n);
await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/fan-noprog.png' });
console.error('done');
await b.close();
