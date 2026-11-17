import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 300000, polling: 1000 }).catch(() => {});
for (let i = 0; i < 40; i++) {
  if (await p.evaluate(() => document.querySelector('[data-testid="game-top-chrome"]') !== null)) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('[data-testid="game-boot-screen"]')?.remove());
await p.waitForTimeout(500);
for (const target of [119, 80, 40, 12]) {
  const m = await p.evaluate((t) => {
    const banner = document.querySelector('[data-testid="chrome-day-banner"]');
    const res = document.querySelector('[data-testid="chrome-resources"]');
    const scale = banner.getBoundingClientRect().width / parseFloat(banner.style.width);
    banner.style.left = `${t / scale}px`;
    const r = banner.getBoundingClientRect();
    return { left: Math.round(r.left), gap: Math.round(res.getBoundingClientRect().left - r.right) };
  }, target);
  console.log(`target=${target} left=${m.left} gapToBar=${m.gap}`);
  await p.screenshot({ path: `test-results/r352-margin-${m.left}.png`, clip: { x: 0, y: 0, width: 1440, height: 120 } });
}
await b.close();
