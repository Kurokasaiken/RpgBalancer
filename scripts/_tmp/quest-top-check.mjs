import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await p.waitForFunction(() => window.__worldCam, null, { timeout: 150000 }); } catch {}
await p.waitForTimeout(12000);
const info = await p.evaluate(() => [...document.querySelectorAll('[data-poi-zanara]')].map(e => ({ f: e.getAttribute('data-poi-zanara'), r: e.getBoundingClientRect() })).filter(m => m.f === 'quest'));
let i = 0;
for (const m of info.slice(0, 3)) {
  const cx = m.r.x + m.r.width / 2, cy = m.r.y + m.r.height / 2;
  await p.screenshot({ path: `test-results/poi-zanara-live/native-top-q${i++}.png`, clip: { x: Math.max(0, cx - 110), y: Math.max(0, cy - 110), width: 220, height: 220 }, timeout: 120000 });
}
console.log('done', info.length);
await b.close();
