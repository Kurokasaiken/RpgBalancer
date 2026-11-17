import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
let ok = false;
for (let i = 0; i < 160 && !ok; i++) {
  const s = await page.evaluate(() => ({
    canvas: document.querySelectorAll('canvas').length,
    veil: document.querySelectorAll('[data-testid="game-boot-screen"]').length,
    hooks: typeof window.__idleVillageTestHooks?.openPoiDetail,
  }));
  if (i % 10 === 0) console.log(`t+${(i * 1.5) | 0}s`, JSON.stringify(s));
  ok = s.canvas > 0 && s.veil === 0 && s.hooks === 'function';
  if (!ok) await page.waitForTimeout(1500);
}
console.log('ready:', ok);
if (!ok) { await b.close(); process.exit(1); }
await page.waitForTimeout(600);
await page.evaluate(() => window.__idleVillageTestHooks.openPoiDetail());
await page.waitForTimeout(1800);
const info = await page.evaluate(() => {
  const detail = document.querySelector('[data-testid="poi-detail-wrapper-test"]') ?? document.querySelector('[class*="capsule"], [class*="poi-detail"]');
  const r = detail?.getBoundingClientRect();
  return { found: !!detail, rect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null, cls: String(detail?.className ?? '').slice(0, 140) };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: 'test-results/hud-real/quest-session-detail.png' });
console.log('errors:', errors.length, errors.slice(0, 3));
await b.close();
