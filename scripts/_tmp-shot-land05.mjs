import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded', timeout: 30000 });
await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
await pg.waitForTimeout(6000);
await pg.evaluate(() => {
  const s = 0.5;
  const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none';
  const origins = { time: 'top center', resources: 'top right', nav: 'bottom center' };
  document.querySelectorAll('[data-hudslot]').forEach(el => {
    el.style.transform = `scale(${s})`;
    el.style.transformOrigin = origins[el.dataset.hudslot] || 'top left';
  });
});
await pg.waitForTimeout(800);
const n = await pg.evaluate(() => document.querySelectorAll('[data-hudslot]').length + ' slots');
console.log(n);
await pg.screenshot({ path: 'test-results/hud-land-05.png' });
await b.close();
