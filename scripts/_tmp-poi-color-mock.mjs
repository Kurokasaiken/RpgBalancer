import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
await page.waitForSelector('[data-poi-zanara="quest"]', { timeout: 120000 });
await page.waitForTimeout(1000);
console.log('zoom LOD:', await page.evaluate(() => document.querySelector('[data-poi-zoom]')?.dataset.poiZoom));

const VARIANTS = ['attuale', 'magenta', 'silver', 'avorio-band', 'sagoma-tonda', 'ombra-teal'];
await page.evaluate(() => {
  window.__mock = (v) => {
    const marks = [...document.querySelectorAll('[data-poi-zanara]')];
    document.querySelectorAll('.mock-teal-shadow').forEach(e => e.remove());
    marks.forEach(m => {
      m.style.borderRadius = ''; m.style.overflow = '';
      m.querySelectorAll('img').forEach(i => { if (i.dataset.origSrc) i.src = i.dataset.origSrc; });
      const h = m.querySelector('.poi-halo');
      if (h) { h.style.removeProperty('--poi-band-far'); h.style.removeProperty('--poi-band-near'); h.style.removeProperty('--poi-glow'); }
    });
    const quests = marks.filter(m => m.dataset.poiZanara === 'quest');
    const setBand = (m, far, near, glow) => { const h = m.querySelector('.poi-halo'); if (h) { h.style.setProperty('--poi-band-far', far); h.style.setProperty('--poi-band-near', near); h.style.setProperty('--poi-glow', glow); } };
    if (v === 'magenta' || v === 'silver') {
      const tones = v === 'magenta' ? ['#9c2f63', '#ff6fa8', '#ff6fa8'] : ['#5a6470', '#cfdae8', '#cfdae8'];
      quests.forEach(m => {
        m.querySelectorAll('img').forEach(i => {
          if (!i.dataset.origSrc) i.dataset.origSrc = i.src;
          i.src = i.src.replace('/layers/', `/layers/_mock/${v}-`);
        });
        setBand(m, ...tones);
      });
    }
    if (v === 'avorio-band') quests.forEach(m => setBand(m, '#b7a273', '#ffefc4', '#ffefc4'));
    if (v === 'sagoma-tonda') quests.forEach(m => { m.style.borderRadius = '50%'; m.style.overflow = 'hidden'; });
    if (v === 'ombra-teal') marks.forEach(m => {
      const d = document.createElement('div');
      d.className = 'mock-teal-shadow';
      d.style.cssText = 'position:absolute;left:6%;right:6%;bottom:-2%;height:22%;border-radius:50%;background:radial-gradient(ellipse,rgba(7,58,58,.6) 0%,rgba(7,58,58,.28) 55%,transparent 75%);pointer-events:none;z-index:-1;';
      m.appendChild(d);
    });
  };
});
for (const v of VARIANTS) {
  await page.evaluate(v => window.__mock(v), v);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `.mw/runs/20261124-hud-critique-multi-ai/mockups/poi-${v}.jpg`, type: 'jpeg', quality: 85, timeout: 60000 });
  console.log('shot', v);
}
await page.close(); process.exit(0);
