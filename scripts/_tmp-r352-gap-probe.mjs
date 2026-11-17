import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 300000, polling: 1000 }).catch(() => {});
for (let i = 0; i < 40; i++) {
  if (await p.evaluate(() => document.querySelector('[data-testid="game-top-chrome"]') !== null)) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('[data-testid="game-boot-screen"]')?.remove());
await p.waitForTimeout(500);
for (const d of [0, 8, 13, 24]) {
  const gap = await p.evaluate((dd) => {
    const banner = document.querySelector('[data-testid="chrome-day-banner"]');
    const res = document.querySelector('[data-testid="chrome-resources"]');
    if (!banner.dataset.base) banner.dataset.base = banner.style.left;
    banner.style.left = `calc(${banner.dataset.base} - ${dd}px)`;
    return Math.round(res.getBoundingClientRect().left - banner.getBoundingClientRect().right);
  }, d);
  console.log(`delta=${d} realGap=${gap}`);
  await p.screenshot({ path: `test-results/r352-gap-${gap}.png`, clip: { x: 0, y: 0, width: 1440, height: 120 } });
}
await b.close();
