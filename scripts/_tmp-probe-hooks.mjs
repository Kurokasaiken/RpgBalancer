import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', (e) => console.log(`[pageerror] ${String(e).slice(0,300)}`));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-map-ready]', { timeout: 120000 });
for (let i = 0; i < 8; i += 1) {
  await p.waitForTimeout(2000);
  const info = await p.evaluate(() => ({
    hooks: Object.keys(window.__idleVillageTestHooks ?? {}).length,
    pois: [...document.querySelectorAll('[data-quest-poi-id]')].map(e => e.getAttribute('data-quest-poi-id')),
    anchors: document.querySelectorAll('[data-map-anchor]').length,
    boot: !!document.querySelector('[data-testid="game-boot-screen"]'),
  }));
  console.log(`t+${(i+1)*2}s`, JSON.stringify(info));
}
await b.close();
