import { chromium } from 'playwright';
const OUT = 'test-results/poi-zanara-live';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', (e) => console.log(`[pageerror] ${String(e).slice(0, 160)}`));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
/* real reveal path: no poiDemo — wait for a REAL quest poi (data-quest-poi-id) positioned by the camera */
await p.waitForFunction(() => {
  const els = document.querySelectorAll('[data-poi-zanara]');
  if (els.length < 1) return false;
  return Array.from(els).some((el) => {
    let n = el;
    while (n && n.parentElement) {
      n = n.parentElement;
      if (n.dataset && n.dataset.worldX !== undefined) return n.style.transform !== '';
    }
    return false;
  });
}, undefined, { timeout: 300000 });
await p.waitForTimeout(8000); /* let the auto-reveal stagger finish */
await p.evaluate(() => {
  for (const el of document.querySelectorAll('[data-testid="game-boot-screen"], [data-boot-veil]')) (el).style.display = 'none';
});
await p.screenshot({ path: `${OUT}/game-real-reveal.png` });
const markers = await p.evaluate(() => Array.from(document.querySelectorAll('[data-poi-zanara]')).map((el) => {
  const r = el.getBoundingClientRect();
  const poi = el.closest('[data-quest-poi-id]');
  return { id: `${el.getAttribute('data-poi-zanara')}${poi ? ':' + poi.getAttribute('data-quest-poi-id') : ''}`, x: r.left + r.width / 2, y: r.top + r.height / 2 };
}));
console.log('real markers:', JSON.stringify(markers));
for (const [i, m] of markers.entries()) {
  const pad = 160;
  const clip = { x: Math.max(0, m.x - pad), y: Math.max(0, m.y - pad), width: pad * 2, height: pad * 2 };
  clip.width = Math.min(clip.width, 1600 - clip.x);
  clip.height = Math.min(clip.height, 900 - clip.y);
  await p.screenshot({ path: `${OUT}/real-${i}-${m.id.replace(/[^a-z0-9-]/gi, '_')}.png`, clip });
}
await b.close();
console.log('done');
