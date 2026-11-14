import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
const t0 = Date.now();
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-map-ready]', { timeout: 180000 });
console.log(`ready ${Math.round((Date.now() - t0) / 1000)}s`);
await p.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(500);

const pausedBefore = await p.evaluate(() => window.__idleVillageTestHooks?.getInvasion?.());
console.log('invasion before:', JSON.stringify(pausedBefore));

// Stage the theatre via the E2E seam (same as the Director action).
await p.evaluate(() => window.__idleVillageTestHooks?.startInvasion?.());
await p.waitForTimeout(200);
const shroud = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="world-event-shroud"], [class*="shroud" i]');
  return el ? getComputedStyle(el).opacity : null;
});
console.log('shroud after trigger:', shroud);

// Card appears at the peak (cardDelayMs + fade-in).
await p.waitForSelector('[data-testid="world-event-card-body"]', { timeout: 15000 }).catch(() => console.log('NO CARD'));
const cardInfo = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="world-event-card-body"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width) };
});
console.log('card:', JSON.stringify(cardInfo));
await p.screenshot({ path: 'test-results/r325-game-restore/w-invasion-card.png' });

// Wait for the card to arm, then click its action button.
await p.waitForTimeout(2500);
const clicked = await p.evaluate(() => {
  const btn = document.querySelector('[data-testid="world-event-card-body"] button');
  if (!btn || btn.disabled) return false;
  btn.click();
  return true;
});
console.log('clicked:', clicked);

// onComplete → invasion state + marker mounts hidden; sticker lands → goblin visible.
await p.waitForTimeout(1000);
const inv = await p.evaluate(() => window.__idleVillageTestHooks?.getInvasion?.());
console.log('invasion after confirm:', JSON.stringify(inv));

for (let i = 0; i < 20; i += 1) {
  const m = await p.evaluate(() => {
    const el = document.querySelector('[data-testid="invasion-goblin-marker"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { op: getComputedStyle(el).opacity, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  if (m && m.op === '1') { console.log('marker landed:', JSON.stringify(m)); break; }
  if (i === 19) console.log('marker state:', JSON.stringify(m));
  await p.waitForTimeout(500);
}

// The ledger should have opened with the invasion row.
await p.waitForTimeout(3000);
const row = await p.evaluate(() => {
  const el = document.querySelector('[data-event-id="invasion"]');
  if (!el) return null;
  return { text: el.textContent?.slice(0, 80), op: getComputedStyle(el).opacity };
});
console.log('ledger row:', JSON.stringify(row));
await p.screenshot({ path: 'test-results/r325-game-restore/w-invasion-after.png' });
await b.close();
