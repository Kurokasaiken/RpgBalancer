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
  const iw = e => e.offsetWidth, ih = e => e.offsetHeight;
  const P = { time: {t:0.012486,w:0.2187447}, resources: {l:0.8,t:0.0108362,w:0.1874959}, nav: {w:0.2395833} };
  for (const k of ['resources','time']) {
    const el = slots[k], p = P[k];
    const s = (p.w * innerWidth) / iw(el);
    el.style.left = k === 'time' ? `${(innerWidth - iw(el) * s) / 2}px` : `${p.l * innerWidth}px`;
    el.style.top = `${p.t * innerHeight}px`;
    el.style.transform = `scale(${s})`;
    el.style.transformOrigin = 'top left';
  }
  // nav: fondo ancorato a 2px dal bordo (punta dentro lo schermo), centrato
  const navScale = (P.nav.w * innerWidth) / iw(slots.nav);
  const navVisH = ih(slots.nav) * navScale;
  slots.nav.style.left = `${(innerWidth - iw(slots.nav) * navScale) / 2}px`;
  slots.nav.style.top = `${innerHeight - navVisH - 2}px`;
  slots.nav.style.transform = `scale(${navScale})`;
  slots.nav.style.transformOrigin = 'top left';
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
  return `nav visH=${navVisH.toFixed(0)} top=${(innerHeight - navVisH - 2).toFixed(0)}`;
}).then(s => console.log(s));
await pg.waitForTimeout(800);
await pg.screenshot({ path: 'test-results/hud-land-mini8.png' });
await b.close();
