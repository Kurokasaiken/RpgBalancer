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
const res = await p.evaluate(() => document.querySelector('[data-testid="chrome-resources"]').getBoundingClientRect().toJSON());
const w = Math.min(170, res.width);
await p.screenshot({ path: 'test-results/r352-cap-left-v3.png', clip: { x: res.x, y: res.y, width: w, height: res.height } });
await p.screenshot({ path: 'test-results/r352-cap-right-v3.png', clip: { x: res.x + res.width - w, y: res.y, width: w, height: res.height } });
await p.screenshot({ path: 'test-results/r352-pair-v3.png', clip: { x: 0, y: 0, width: 1440, height: 130 } });
await b.close();
