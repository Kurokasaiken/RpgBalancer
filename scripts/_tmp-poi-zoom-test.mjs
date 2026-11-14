import { chromium } from 'playwright';
const OUT = 'test-results/poi-zanara-live';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => Array.from(document.querySelectorAll('[data-poi-zanara]')).some((el) => {
  let n = el;
  while (n && n.parentElement) { n = n.parentElement; if (n.dataset?.worldX !== undefined) return n.style.transform !== ''; }
  return false;
}), undefined, { timeout: 300000 });
await p.waitForTimeout(6000);
await p.evaluate(() => { for (const el of document.querySelectorAll('[data-testid="game-boot-screen"], [data-boot-veil]')) el.style.display = 'none'; });
const size = () => p.evaluate(() => {
  const el = document.querySelector('[data-quest-poi-id="poi-goblin"] [data-poi-zanara]') ?? document.querySelector('[data-poi-zanara]');
  const r = el.getBoundingClientRect(); return { w: Math.round(r.width), x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
const s0 = await size();
/* centre on the goblin POI and zoom in */
const m = await p.evaluate(() => {
  const el = document.querySelector('[data-quest-poi-id="poi-goblin"] [data-poi-zanara]');
  const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
await p.mouse.move(m.x - 350, m.y + 150);
for (let i = 0; i < 6; i += 1) { await p.mouse.wheel(0, -400); await p.waitForTimeout(300); }
await p.waitForTimeout(1200);
const s1 = await size();
await p.screenshot({ path: `${OUT}/zoom-in.png` });
console.log('size@fit:', JSON.stringify(s0), '→ size@zoom-in:', JSON.stringify(s1));
await b.close();
