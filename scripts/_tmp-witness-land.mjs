import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
await pg.waitForTimeout(6000);
await pg.evaluate(() => { const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none'; });
await pg.waitForTimeout(800);
const info = await pg.evaluate(() => {
  const mode = document.querySelector('[data-hud-mode]')?.dataset.hudMode;
  const boxes = [...document.querySelectorAll('[data-hudslot]')].map(e => { const r = e.getBoundingClientRect(); return `${e.dataset.hudslot}:${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)},${Math.round(r.top)} b=${Math.round(r.bottom)}`; });
  const corner = document.querySelector('[data-hud-corner]')?.getBoundingClientRect();
  return { mode, boxes, corner: corner && `${Math.round(corner.width)}x${Math.round(corner.height)}@${Math.round(corner.left)},${Math.round(corner.top)}` };
});
console.log(JSON.stringify(info, null, 1));
await pg.screenshot({ path: 'test-results/hud-land-impl.png' });
await b.close();
