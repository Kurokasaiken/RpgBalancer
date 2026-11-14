import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
// 1) misura desktop 1920x1080: posizioni % degli slot + bottoni tondi
const d = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await d.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await d.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
await d.waitForTimeout(4000);
const desk = await d.evaluate(() => {
  const out = {};
  document.querySelectorAll('[data-hudslot]').forEach(el => {
    const r = el.getBoundingClientRect();
    out[el.dataset.hudslot] = { l: r.left/innerWidth, t: r.top/innerHeight, w: r.width/innerWidth, h: r.height/innerHeight };
  });
  // cluster bottoni tondi in basso a destra: elementi absoluti che contengono button nel quadrante
  const btns = [...document.querySelectorAll('div[style*="position: absolute"], div[style*="position:absolute"]')]
    .map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(({r}) => r.left > innerWidth*0.7 && r.top > innerHeight*0.7 && r.width < 400 && r.height < 200);
  if (btns[0]) { const r = btns[0].r; out._btns = { l: r.left/innerWidth, t: r.top/innerHeight, w: r.width/innerWidth, h: r.height/innerHeight }; }
  return out;
});
console.log('desktop %:', JSON.stringify(desk));
await d.close();
// 2) applica % identiche su 844x390
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
await pg.waitForTimeout(6000);
await pg.evaluate((desk) => {
  const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none';
  document.querySelectorAll('[data-hudslot]').forEach(el => {
    const p = desk[el.dataset.hudslot]; if (!p) return;
    const r = el.getBoundingClientRect();
    const s = (p.w * innerWidth) / r.width;   // scala = stessa % larghezza
    el.style.left = `${p.l * innerWidth}px`;
    el.style.top = `${p.t * innerHeight}px`;
    el.style.transform = `scale(${s})`;
    el.style.transformOrigin = 'top left';
  });
}, desk);
await pg.waitForTimeout(800);
await pg.screenshot({ path: 'test-results/hud-land-mini.png' });
console.log('mini done');
await b.close();
