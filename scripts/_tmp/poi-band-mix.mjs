import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', (e) => console.log('ERR', String(e).slice(0, 120)));
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(5000);
try { await page.waitForSelector('[data-poi-zanara]', { timeout: 30000 }); } catch { console.log('no zanara'); }
const boxes = await page.evaluate(() => {
  const out = {};
  for (const a of document.querySelectorAll('[data-poi-zoom]')) {
    const f = a.querySelector('[data-poi-zanara]')?.getAttribute('data-poi-zanara');
    if (f && !out[f]) { const r = a.getBoundingClientRect(); out[f] = { x: r.x + r.width/2, y: r.y + r.height/2 }; }
  }
  return out;
});
console.log('boxes', JSON.stringify(boxes));
const mixes = [
  ['m00', '#0e3076', '#0b4a2a'],
  ['m35', '#244da6', '#137642'],
  ['m55', '#315dc1', '#18904f'],
  ['m75', '#3d6edd', '#1da95d'],
];
for (const [name, q, j] of mixes) {
  await page.evaluate(([q2, j2]) => {
    document.querySelectorAll('.poi-halo').forEach((h) => {
      const fam = h.closest('[data-poi-zanara]')?.getAttribute('data-poi-zanara');
      h.style.setProperty('--poi-band-far', fam === 'job' ? j2 : q2);
    });
  }, [q, j]);
  await page.waitForTimeout(150);
  for (const [f, b] of Object.entries(boxes)) {
    await page.screenshot({ path: `/tmp/mix-${name}-${f}.png`, clip: { x: Math.max(0,b.x-80), y: Math.max(0,b.y-80), width: 160, height: 160 } });
  }
}
await browser.close();
console.log('done');
