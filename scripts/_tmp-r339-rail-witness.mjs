import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const out = {};

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
p.on('console', m => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300)); });
await p.goto('http://localhost:5174/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 40; i++) {
  const ok = await p.evaluate(() => document.querySelector('[data-testid="roster-stash-rail"]') !== null);
  if (ok) break;
  await p.waitForTimeout(1500);
}
await p.waitForTimeout(3000);

/* A — expanded rail, Roster tab: geometry + rows. */
out.rosterTab = await p.evaluate(() => {
  const rail = document.querySelector('[data-testid="roster-stash-rail"]');
  if (!rail) return null;
  const r = rail.getBoundingClientRect();
  return {
    left: Math.round(r.left), top: Math.round(r.top), bottomGap: Math.round(window.innerHeight - r.bottom),
    width: Math.round(r.width),
    rows: document.querySelectorAll('[data-testid^="rail-roster-row-"]').length,
    bars: rail.querySelectorAll('[role="img"][aria-label]').length,
    tabs: [...document.querySelectorAll('[role="tab"]')].map(t => t.getAttribute('data-testid')),
  };
});
await p.screenshot({ path: 'test-results/r339-rail-roster.png', clip: { x: 0, y: 0, width: 380, height: 660 } });

/* B — Stash tab: chips + item rows. */
await p.click('[data-testid="rail-tab-stash"]');
await p.waitForTimeout(600);
out.stashTab = await p.evaluate(() => ({
  chips: document.querySelectorAll('[data-testid^="rail-member-chip-"]').length,
  items: document.querySelectorAll('[data-testid^="rail-stash-item-"]').length,
  capacity: [...document.querySelectorAll('span')].map(s => s.textContent).find(t => /of .* goods|beni/i.test(t)) ?? null,
}));
await p.screenshot({ path: 'test-results/r339-rail-stash.png', clip: { x: 0, y: 0, width: 380, height: 660 } });

/* C — collapse chip → edge chip → expand restores. */
await p.click('[data-testid="rail-collapse-chip"]');
await p.waitForTimeout(400);
out.collapsed = await p.evaluate(() => {
  const chip = document.querySelector('[data-testid="rail-expand-chip"]');
  return chip ? { chip: true, width: Math.round(chip.getBoundingClientRect().width) } : { chip: false };
});
await p.screenshot({ path: 'test-results/r339-rail-collapsed.png', clip: { x: 0, y: 0, width: 120, height: 120 } });
await p.click('[data-testid="rail-expand-chip"]');
await p.waitForTimeout(400);
out.restored = await p.evaluate(() => ({
  rail: document.querySelector('[data-testid="roster-stash-rail"]') !== null,
  selectedTab: document.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute('data-testid'),
}));
await p.close();

/* D — narrow viewport 1024: rail still mounts; ledger sees left inset. */
const q = await b.newPage({ viewport: { width: 1024, height: 768 } });
q.on('pageerror', e => console.log('[narrow pageerror]', String(e).slice(0, 300)));
await q.goto('http://localhost:5174/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 40; i++) {
  const ok = await q.evaluate(() => document.querySelector('[data-testid="roster-stash-rail"],[data-testid="rail-expand-chip"]') !== null);
  if (ok) break;
  await q.waitForTimeout(1500);
}
await q.waitForTimeout(2500);
out.narrow = await q.evaluate(() => ({
  rail: document.querySelector('[data-testid="roster-stash-rail"]') !== null,
  chip: document.querySelector('[data-testid="rail-expand-chip"]') !== null,
}));
await q.screenshot({ path: 'test-results/r339-rail-narrow.png', clip: { x: 0, y: 0, width: 400, height: 768 } });
await q.close();

console.log(JSON.stringify(out, null, 2));
await b.close();
