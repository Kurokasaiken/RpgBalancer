import { chromium } from 'playwright';
// % desktop misurate a 1920x1080 → scale su viewport 844x390 (intrinsic 360x63, 360x108, 460x118)
const variants = [
  { name: 'hud-land-sameH', scales: { time: 0.068*390/63, resources: 0.10*390/108, nav: 0.109*390/118 } },  // stessa % altezza
  { name: 'hud-land-sameW', scales: { time: 0.219*844/360, resources: 0.187*844/360, nav: 0.24*844/460 } },  // stessa % larghezza
];
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
for (const v of variants) {
  const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
  await pg.waitForTimeout(6000);
  await pg.evaluate((scales) => {
    const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none';
    const origins = { time: 'top center', resources: 'top right', nav: 'bottom center' };
    document.querySelectorAll('[data-hudslot]').forEach(el => {
      const s = scales[el.dataset.hudslot] ?? 1;
      el.style.transform = `scale(${s})`;
      el.style.transformOrigin = origins[el.dataset.hudslot] || 'top left';
    });
  }, v.scales);
  await pg.waitForTimeout(800);
  await pg.screenshot({ path: `test-results/${v.name}.png` });
  console.log(v.name, JSON.stringify(v.scales));
  await pg.close();
}
await b.close();
