import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await p.waitForFunction(() => window.__worldCam, null, { timeout: 150000 }); } catch { console.log('CAM TIMEOUT'); }
await p.waitForTimeout(15000);
const veil = await p.evaluate(() => {
  const m = [...document.querySelectorAll('[data-poi-zanara]')].map(e => ({ f: e.getAttribute('data-poi-zanara'), r: e.getBoundingClientRect(), vis: e.checkVisibility() }));
  return { cam: !!window.__worldCam, markers: m.map(x => ({ f: x.f, x: Math.round(x.r.x), y: Math.round(x.r.y), vis: x.vis })) };
});
console.log(JSON.stringify(veil));
await p.screenshot({ path: 'test-results/poi-zanara-live/state.png', timeout: 120000 });
let i = 0;
for (const m of veil.markers.filter(x => x.f === 'quest').slice(0, 2)) {
  await p.screenshot({ path: `test-results/poi-zanara-live/native2-q${i++}.png`, clip: { x: Math.max(0, m.x - 90), y: Math.max(0, m.y - 90), width: 220, height: 220 }, timeout: 120000 });
}
await b.close();
