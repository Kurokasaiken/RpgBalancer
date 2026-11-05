import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl, null, { timeout: 90000 });
await p.waitForTimeout(5000);
await p.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'village')?.click());
await p.waitForTimeout(400);
await p.evaluate(() => window.__worldCamCtl.set({ panX: 1055, panY: 475, zoom: 2 }));
await p.waitForTimeout(400);
const click = (lab) => p.evaluate((lab) => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===lab); b?.scrollIntoView({block:'center'}); b?.click(); }, lab);
for (const [lab, name] of [['straw · — · wood+none','stw0'], ['straw · palisade · wood+wood','stw2'], ['stone · wall · stone+wood','mx'], ['stone · wall · none+stone','e1'], ['stone · wall · wood+none','w1'], ['stone · palisade · stone+wood','mx2']]) {
  await click(lab); await p.waitForTimeout(900);
  await p.screenshot({ path: `/tmp/v2-${name}.png`, clip: { x: 410, y: 60, width: 1020, height: 780 } });
}
await b.close(); console.log('done');
