import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
await pg.waitForTimeout(6000);
await pg.evaluate(() => {
  const desk = { time: {l:0.390625,t:0.012485532407407407,w:0.21874465942382812}, resources: {l:0.8,t:0.010836226851851852,w:0.18749586741129556}, nav: {l:0.3802083333333333,t:0.8854600694444444,w:0.23958333333333334} };
  const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none';
  document.querySelectorAll('[data-hudslot]').forEach(el => {
    const p = desk[el.dataset.hudslot]; if (!p) return;
    const r = el.getBoundingClientRect();
    el.style.left = `${p.l * innerWidth}px`;
    el.style.top = `${p.t * innerHeight}px`;
    el.style.transform = `scale(${(p.w * innerWidth) / r.width})`;
    el.style.transformOrigin = 'top left';
  });
  // bottoni tondi: scala 0.44 ancorata all'angolo basso-destro (stessa % della nav)
  const seen = new Set();
  document.querySelectorAll('div,button').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.left > innerWidth*0.8 && r.top > innerHeight*0.75 && Math.abs(r.width - r.height) < 8 && r.width > 20 && r.width < 100 && !el.closest('[data-hudslot]')) {
      const host = el.closest('div[style*="position: absolute"], div[style*="position:absolute"]') || el;
      if (seen.has(host)) return;
      seen.add(host);
      host.style.transform = 'scale(0.44)';
      host.style.transformOrigin = 'bottom right';
    }
  });
  return seen.size;
}, ).then(n => console.log('btn hosts scaled:', n));
await pg.waitForTimeout(800);
await pg.screenshot({ path: 'test-results/hud-land-mini3.png' });
await b.close();
