import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-11-02';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.setDefaultTimeout(90000);
p.on('response', (r) => { if (r.url().includes('village') && r.status() >= 400) console.log('HTTP', r.status(), r.url().split('/').pop()); });
p.on('requestfailed', (r) => { if (r.url().includes('village')) console.log('REQFAIL', r.url().split('/').pop(), r.failure()?.errorText); });
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 });
await p.waitForTimeout(4000);
await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'village'); e?.click(); });
await p.waitForTimeout(800);
const click = async (t) => p.evaluate((x) => { const e = [...document.querySelectorAll('button')].find((b2) => b2.textContent.trim() === x); e?.click(); return !!e; }, t);
await p.evaluate(() => { window.__worldCamCtl.set({ panX: 1515 - 720 / 1.4, panY: 720 - 450 / 1.4, zoom: 1.4 }); });
for (const [label, name] of [['stone · wall · stone+none', 'wall-stoneS-v2'], ['stone · wall · wood+none', 'wall-woodS-v2'], ['stone · palisade · wood+stone', 'pal-mixed-v2']]) {
  console.log(name, await click(label));
  await p.waitForTimeout(9000);
  await p.screenshot({ path: `${OUT}/${name}-z14.png` });
}
await b.close(); console.log('done');
