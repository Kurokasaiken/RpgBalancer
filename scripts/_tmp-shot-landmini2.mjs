import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const d = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
await d.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await d.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
await d.waitForTimeout(4000);
const desk = await d.evaluate(() => {
  const out = { btns: [] };
  document.querySelectorAll('[data-hudslot]').forEach(el => {
    const r = el.getBoundingClientRect();
    out[el.dataset.hudslot] = { l: r.left/innerWidth, t: r.top/innerHeight, w: r.width/innerWidth };
  });
  // bottoni tondi: cerchi (aspect ~1) nel quadrante basso-destra, non dentro hudslot
  document.querySelectorAll('div,button').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.left > innerWidth*0.85 && r.top > innerHeight*0.85 && Math.abs(r.width - r.height) < 8 && r.width > 20 && r.width < 100 && !el.closest('[data-hudslot]')) {
      out.btns.push({ l: r.left/innerWidth, t: r.top/innerHeight, w: r.width/innerWidth });
    }
  });
  return out;
});
console.log('desk:', JSON.stringify(desk));
await d.close();
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await pg.waitForSelector('[data-hudslot="nav"]', { timeout: 120000 });
await pg.waitForTimeout(6000);
await pg.evaluate((desk) => {
  const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none';
  document.querySelectorAll('[data-hudslot]').forEach(el => {
    const p = desk[el.dataset.hudslot]; if (!p) return;
    const r = el.getBoundingClientRect();
    el.style.left = `${p.l * innerWidth}px`;
    el.style.top = `${p.t * innerHeight}px`;
    el.style.transform = `scale(${(p.w * innerWidth) / r.width})`;
    el.style.transformOrigin = 'top left';
  });
  // scala+riposiziona i bottoni tondi in basso a destra con le stesse % desktop
  const s = desk.btns.length ? (desk.btns[0].w * innerWidth) / (document.querySelector('div[style*="position: absolute"], button')?.getBoundingClientRect().width || 44) : 0.44;
  const btns = [...document.querySelectorAll('div,button')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.left > innerWidth*0.8 && r.top > innerHeight*0.7 && Math.abs(r.width - r.height) < 8 && r.width > 20 && r.width < 100 && !el.closest('[data-hudslot]');
  }).sort((a, b2) => a.getBoundingClientRect().left - b2.getBoundingClientRect().left);
  btns.forEach((el, i) => {
    const p = desk.btns[i]; if (!p) return;
    const r = el.getBoundingClientRect();
    const sc = (p.w * innerWidth) / r.width;
    const host = el.closest('div[style*="position: absolute"], div[style*="position:absolute"]') || el;
    host.style.left = `${p.l * innerWidth}px`;
    host.style.top = `${p.t * innerHeight}px`;
    host.style.transform = `scale(${sc})`;
    host.style.transformOrigin = 'top left';
    host.style.position = 'absolute';
  });
  return btns.length;
}, desk);
await pg.waitForTimeout(800);
await pg.screenshot({ path: 'test-results/hud-land-mini2.png' });
console.log('mini2 done');
await b.close();
