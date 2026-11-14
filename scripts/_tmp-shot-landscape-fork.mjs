import { chromium } from 'playwright';
const variants = [{ s: 0.65, name: 'hud-land-065' }, { s: 0.5, name: 'hud-land-05' }];
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
for (const v of variants) {
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded', timeout: 30000 });
  try { await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 90000 }); } catch {}
  await pg.waitForTimeout(4000);
  await pg.evaluate((s) => {
    const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none';
    const origins = { time: 'top center', resources: 'top right', nav: 'bottom center' };
    document.querySelectorAll('[data-hudslot]').forEach(el => {
      el.style.transform = `scale(${s})`;
      el.style.transformOrigin = origins[el.dataset.hudslot] || 'top left';
    });
    // bottoni tondi in basso a destra (fuori dagli hudslot)
    document.querySelectorAll('[class*="RoundButton"], [class*="roundButton"]').forEach(el => {
      const host = el.closest('[style*="position: absolute"]') || el;
      host.style.transform = `scale(${s})`;
      host.style.transformOrigin = 'bottom right';
    });
  }, v.s);
  await pg.waitForTimeout(800);
  await pg.screenshot({ path: `test-results/${v.name}.png` });
  await pg.close();
  console.log(v.name, 'done');
}
await b.close();
