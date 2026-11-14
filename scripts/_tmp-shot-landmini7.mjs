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
  const iw = e => e.offsetWidth;
  // % desktop 1920x1080 misurate: left/top/width
  const P = { time: {l:0.390625,t:0.012486,w:0.2187447}, resources: {l:0.8,t:0.0108362,w:0.1874959}, nav: {l:0.3802083,t:0.8854601,w:0.2395833} };
  const out = [];
  for (const k of ['resources','time','nav']) {
    const el = slots[k], p = P[k];
    const s = (p.w * innerWidth) / iw(el);
    el.style.left = `${p.l * innerWidth}px`;
    el.style.top = `${p.t * innerHeight}px`;
    el.style.transform = `scale(${s})`;
    el.style.transformOrigin = 'top left';
    out.push(`${k}=${s.toFixed(3)}`);
  }
  // centra time e nav su x (come desktop: entrambi centrati)
  for (const k of ['time','nav']) {
    const el = slots[k];
    el.style.left = `${(innerWidth - iw(el) * parseFloat(el.style.transform.match(/[\d.]+/)[0])) / 2}px`;
  }
  const seen = new Set();
  const navScale = parseFloat(slots.nav.style.transform.match(/[\d.]+/)[0]);
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
  return out.join(' ');
}).then(s => console.log(s));
await pg.waitForTimeout(800);
await pg.screenshot({ path: 'test-results/hud-land-mini7.png' });
await b.close();
