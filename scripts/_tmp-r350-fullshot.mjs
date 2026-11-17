import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(5000);
await p.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 300000, polling: 1000 });
for (let i = 0; i < 40; i++) {
  if (await p.evaluate(() => document.querySelector('[data-testid="game-top-chrome"]') !== null)) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(3000);
await p.screenshot({ path: 'test-results/r350-fullpage-1440.png' });
console.log('done');
await b.close();
