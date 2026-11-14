import { chromium } from 'playwright';
const OUT = 'test-results/poi-zanara-live';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', (e) => console.log(`[pageerror] ${String(e).slice(0, 160)}`));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => {
  const els = document.querySelectorAll('[data-poi-zanara]');
  if (els.length < 5) return false;
  return Array.from(els).every((el) => {
    let n = el;
    while (n && n.parentElement) {
      n = n.parentElement;
      if (n.dataset && n.dataset.worldX !== undefined) return n.style.transform !== '';
    }
    return false;
  });
}, undefined, { timeout: 240000 });
await p.keyboard.press('3'); /* speeds[2] = ×4 — the clock must run for the rings to move */
await p.waitForTimeout(2500);
await p.evaluate(() => {
  for (const el of document.querySelectorAll('[data-testid="game-boot-screen"], [data-boot-veil]')) (el).style.display = 'none';
});
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/game-full.png` });
const markers = await p.evaluate(() => Array.from(document.querySelectorAll('[data-poi-zanara]')).map((el) => {
  const r = el.getBoundingClientRect();
  const poi = el.closest('[data-quest-poi-id]');
  return { id: `${el.getAttribute('data-poi-zanara')}${poi ? ':' + poi.getAttribute('data-quest-poi-id') : ''}`, x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.round(r.width) };
}));
markers.forEach((m, i) => console.log('marker', i, JSON.stringify(m)));
for (const [i, m] of markers.entries()) {
  if (m.x < -50 || m.x > 1650 || m.y < -50 || m.y > 950) continue;
  const pad = 150;
  const clip = { x: Math.max(0, m.x - pad), y: Math.max(0, m.y - pad), width: pad * 2, height: pad * 2 };
  clip.width = Math.min(clip.width, 1600 - clip.x);
  clip.height = Math.min(clip.height, 900 - clip.y);
  await p.screenshot({ path: `${OUT}/poi-${i}-${m.id.replace(/[^a-z0-9-]/gi, '_')}.png`, clip });
}
await b.close();
console.log('done');
