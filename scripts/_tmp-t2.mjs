import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.setDefaultTimeout(90000);
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCamCtl, { timeout: 90000 });
await p.waitForTimeout(3500);
await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'village'); e?.click(); });
await p.waitForTimeout(600);
await p.evaluate(() => { window.__worldCamCtl.set({ panX: 1515 - 720 / 1.3, panY: 720 - 450 / 1.3, zoom: 1.3 }); });
const click = (t) => p.evaluate((x) => { const e = [...document.querySelectorAll('button')].find((b2) => b2.textContent.trim() === x); e?.click(); return !!e; }, t);
for (const [l, n] of [['stone · wall · wood+stone', 'mixed'], ['stone · wall · stone+stone', 'final']]) {
  console.log(n, await click(l));
  await p.waitForTimeout(7000);
  await p.screenshot({ path: `test-results/village-witness-2026-11-02/towers-inside-${n}.png` });
}
await b.close(); console.log('done');
