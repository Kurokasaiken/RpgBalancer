import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__worldCam, null, { timeout: 120000 }); } catch {}
await page.waitForTimeout(2500);
const variants = [
  ['v0-cur', '#4d82ff', '#23c96e'],
  ['v1-deep', '#2f5fb8', '#3f8f4f'],
  ['v2-dusty', '#6f83b8', '#7d9c4f'],
  ['v3-gold', '#d9a84e', '#d9a84e'],
];
// pick a stable anchor box once
const box = await page.evaluate(() => {
  const a = document.querySelector('[data-poi-zoom] [data-poi-zanara="quest"]')?.closest('[data-poi-zoom]');
  if (!a) return null; const r = a.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
for (const [name, quest, job] of variants) {
  await page.evaluate(([q, j]) => {
    document.querySelectorAll('.poi-halo').forEach((h) => {
      const fam = h.closest('[data-poi-zanara]')?.getAttribute('data-poi-zanara');
      h.style.setProperty('--poi-band-far', fam === 'job' ? j : q);
    });
  }, [quest, job]);
  await page.waitForTimeout(120);
  if (box) await page.screenshot({ path: `/tmp/halo-${name}-crop.png`, clip: { x: box.x - 130, y: box.y - 130, width: 260, height: 260 } });
}
await page.evaluate(([q, j]) => { document.querySelectorAll('.poi-halo').forEach((h) => { const f = h.closest('[data-poi-zanara]')?.getAttribute('data-poi-zanara'); h.style.setProperty('--poi-band-far', f === 'job' ? j : q); }); }, ['#2f5fb8', '#3f8f4f']);
await page.waitForTimeout(120);
await page.screenshot({ path: '/tmp/halo-v1-full.png' });
await browser.close();
console.log('done', JSON.stringify(box));
