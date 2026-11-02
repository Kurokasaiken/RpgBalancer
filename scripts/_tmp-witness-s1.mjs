import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-02';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.setDefaultTimeout(90000);
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
const ready = async () => { await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 }); await p.waitForTimeout(2000); };
await ready();
await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'village'); e?.click(); });
await p.waitForTimeout(800);
const click = async (t) => {
  for (let i = 0; i < 10; i++) {
    const ok = await p.evaluate((x) => { const e = [...document.querySelectorAll('button')].find((b2) => b2.textContent.trim() === x); e?.click(); return !!e; }, t);
    if (ok) return true;
    await p.waitForTimeout(800);
  }
  return false;
};
const cam = async (z) => { await p.waitForFunction(() => window.__worldCamCtl); await p.evaluate((zz) => { window.__worldCamCtl.set({ panX: 1515 - 720 / zz, panY: 720 - 450 / zz, zoom: zz }); }, z); };
for (const [label, name] of [['stone · wall · stone+none', 'wall-stoneS'], ['stone · palisade · stone+none', 'pal-stoneS'], ['stone · wall · stone+stone', 'wall-stone-both'], ['stone · palisade · wood+stone', 'pal-mixed']]) {
  console.log(name, await click(label));
  await p.waitForTimeout(9000);
  await cam(1.4); await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/${name}-z14.png` });
  await cam(3.0); await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/${name}-z30.png` });
}
await b.close(); console.log('done');
