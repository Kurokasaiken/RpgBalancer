import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const out = {};

// — A: /game rest state → ExpeditionEdgeTab docked right —
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[game pageerror]', String(e).slice(0, 200)));
p.on('console', m => { if (m.type() === 'error') console.log('[game console.error]', m.text().slice(0, 200)); });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 40; i++) {
  const ok = await p.evaluate(() => document.querySelector('[data-testid="expedition-edge-tab"]') !== null || document.querySelector('canvas'));
  if (ok) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(4000);
out.edgeTab = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="expedition-edge-tab"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { visible: true, right: Math.round(r.right), viewportW: window.innerWidth, text: el.textContent.slice(0, 80) };
});
await p.screenshot({ path: 'test-results/r339-edge-tab.png' });
await p.close();

// — B: /hud-compose?comp=cassetto → journey total + disabled reason —
const q = await b.newPage({ viewport: { width: 1440, height: 900 } });
q.on('pageerror', e => console.log('[compose pageerror]', String(e).slice(0, 200)));
await q.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 40; i++) {
  const ok = await q.evaluate(() => document.querySelector('[data-cassetto-bag]') !== null);
  if (ok) break;
  await q.waitForTimeout(1500);
}
await q.waitForTimeout(1500);
out.cassetto = await q.evaluate(() => ({
  total: document.querySelector('[data-testid="cassetto-journey-total"]')?.textContent ?? null,
  reason: document.querySelector('[data-testid="cassetto-confirm-reason"]')?.textContent ?? null,
  canSend: document.querySelector('[data-can-send]')?.getAttribute('data-can-send'),
  legs: [...document.querySelectorAll('[data-hudreal-cassetto] span')].map(s => s.textContent).filter(t => /day|giorn/i.test(t)),
}));
await q.screenshot({ path: 'test-results/r339-cassetto.png', clip: { x: 900, y: 0, width: 540, height: 900 }, timeout: 20000 });
await q.close();
console.log(JSON.stringify(out, null, 2));
await b.close();
