import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
await pg.waitForTimeout(6000);
await pg.evaluate(() => {
  const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none';
  const slots = {};
  document.querySelectorAll('[data-hudslot]').forEach(el => { slots[el.dataset.hudslot] = el; });
  // dimensioni intrinseche (non trasformate)
  const iw = e => e.offsetWidth, ih = e => e.offsetHeight;
  const resTop = 0.010836 * innerHeight;
  const resScale = (0.1874959 * innerWidth) / iw(slots.resources);
  const resVisH = ih(slots.resources) * resScale;
  // resources: top-right alla % desktop
  slots.resources.style.left = `${0.8 * innerWidth}px`;
  slots.resources.style.top = `${resTop}px`;
  slots.resources.style.transform = `scale(${resScale})`;
  slots.resources.style.transformOrigin = 'top left';
  // time: STESSA altezza di resources, centrato nella pagina
  const tScale = resVisH / ih(slots.time);
  slots.time.style.left = `${(innerWidth - iw(slots.time) * tScale) / 2}px`;
  slots.time.style.top = `${resTop}px`;
  slots.time.style.transform = `scale(${tScale})`;
  slots.time.style.transformOrigin = 'top left';
  // nav: % desktop, centrato in basso
  const navScale = (0.2395833 * innerWidth) / iw(slots.nav);
  slots.nav.style.left = `${(innerWidth - iw(slots.nav) * navScale) / 2}px`;
  slots.nav.style.top = `${0.8854601 * innerHeight}px`;
  slots.nav.style.transform = `scale(${navScale})`;
  slots.nav.style.transformOrigin = 'top left';
  // pulsantini: stessa scala nav, ancorati basso-destra
  const seen = new Set();
  document.querySelectorAll('div,button').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.left > innerWidth*0.8 && r.top > innerHeight*0.75 && Math.abs(r.width - r.height) < 8 && r.width > 20 && r.width < 100 && !el.closest('[data-hudslot]')) {
      const host = el.closest('div[style*="position: absolute"], div[style*="position:absolute"]') || el;
      if (seen.has(host)) return;
      seen.add(host);
      host.style.transform = `scale(${navScale})`;
      host.style.transformOrigin = 'bottom right';
    }
  });
  return `res=${resScale.toFixed(3)} time=${tScale.toFixed(3)} nav=${navScale.toFixed(3)}`;
}).then(s => console.log(s));
await pg.waitForTimeout(800);
await pg.screenshot({ path: 'test-results/hud-land-mini5.png' });
await b.close();
