import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
p.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300)); });
p.on('requestfailed', r => { if (r.url().includes('webp') || r.url().includes('assets')) console.log('[reqfail]', r.url()); });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 300000, polling: 1000 }).catch(() => {});
for (let i = 0; i < 40; i++) {
  const ok = await p.evaluate(() => document.querySelector('[data-testid="game-top-chrome"]') !== null);
  if (ok) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(3000);
const r = await p.evaluate(() => {
  const res = document.querySelector('[data-testid="chrome-resources"]')?.getBoundingClientRect();
  const mirror = document.querySelector('[data-testid="chrome-res-cap-mirror"]')?.getBoundingClientRect();
  const banner = document.querySelector('[data-testid="chrome-day-banner"]')?.getBoundingClientRect();
  const img = document.querySelector('[data-testid="chrome-res-cap-mirror"] img');
  const top = [...document.querySelectorAll('body *')].filter(el => {
    const s = getComputedStyle(el), r2 = el.getBoundingClientRect();
    return r2.top <= 70 && r2.bottom >= 60 && r2.left <= 700 && r2.right >= 700 && (s.position === 'fixed' || s.position === 'absolute') && +s.zIndex > 0;
  }).map(el => `${el.dataset.testid || el.className.toString().slice(0, 40)} z=${getComputedStyle(el).zIndex}`);
  if (!res || !mirror || !banner) return { missing: true, top };
  return {
    res: { l: +res.left.toFixed(1), w: +res.width.toFixed(1), top: +res.top.toFixed(1), h: +res.height.toFixed(1) },
    mirror: { l: +(mirror.left - res.left).toFixed(1), w: +mirror.width.toFixed(1), h: +mirror.height.toFixed(1) },
    imgLoaded: img ? img.complete && img.naturalWidth > 0 : null,
    resCenter: Math.round(res.left + res.width / 2), pairGap: Math.round(res.left - banner.right), top,
  };
});
console.log(JSON.stringify(r, null, 1));
await p.evaluate(() => document.querySelector('[data-testid="game-boot-screen"]')?.remove());
const res2 = await p.evaluate(() => document.querySelector('[data-testid="chrome-resources"]').getBoundingClientRect().toJSON());
await p.screenshot({ path: 'test-results/r352-cap-final-left.png', clip: { x: res2.x, y: res2.y, width: Math.min(160, res2.width), height: res2.height } });
await p.screenshot({ path: 'test-results/r352-cap-final-pair.png', clip: { x: 0, y: 0, width: 1440, height: 130 } });
await b.close();
