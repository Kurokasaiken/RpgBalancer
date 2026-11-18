// R-359 residual: TRUE two-occupied-slot swap — drag slot-token A onto occupied slot B.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const url = process.env.PROBE_URL || 'https://rpg-balancer.vercel.app/game';
const OUT = '.mw/bugs/20261118-medallion-drag/evidence';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
let im = null;
while (Date.now() - t0 < 120000) {
  im = await page.evaluate(() => window.__gameBoot?.interactiveMs > 0 ? window.__gameBoot.interactiveMs : null);
  if (im !== null) break;
  await sleep(2000);
}
if (!im) { console.error('TIMEOUT'); process.exit(1); }
await sleep(2000);
await page.keyboard.press('r');
await sleep(1200);
const pois = page.locator('[data-testid="map-quest-poi"]');
for (let i = 0; i < await pois.count(); i++) {
  await pois.nth(i).click({ force: true }); await sleep(1500);
  if ((await page.locator('[data-slot-id]').count()) > 0) break;
}

const occupants = () => page.evaluate(() =>
  [...document.querySelectorAll('[data-slot-id]')].map((slot) => {
    const tok = slot.querySelector('[data-testid^="slot-token-"]');
    const img = tok?.querySelector('img:not([src*="ring"]):not([src*="ghiera"])');
    return { slot: slot.getAttribute('data-slot-id'), occupant: tok ? (img ? img.src.split('/').pop() : 'occupied') : null };
  }));

const cards = await page.evaluate(() =>
  [...document.querySelectorAll('[data-resident-id]')].filter(e => e.getBoundingClientRect().width > 0)
    .map((el) => { const r = el.getBoundingClientRect();
      return { id: el.getAttribute('data-resident-id'), x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
const slots = await page.evaluate(() =>
  [...document.querySelectorAll('[data-slot-id]')].slice(0, 2).map((el) => { const r = el.getBoundingClientRect();
    return { id: el.getAttribute('data-slot-id'), x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));

// assign A -> slot0, B -> slot1 — re-query card coords fresh each iteration
// (roster re-renders after each assign; stale coords were the probe bug)
// Pair chosen for mutual eligibility (goblin slot gates):
//   giggiolillo (edge|precision) -> leader (edge|fortitude) AND member-1 ✓
//   spaccaculi  (fortitude|warden) -> member-1 AND leader ✓
// Salvatrice (ward|clarity) is INELIGIBLE for member-1 — a swap with her
// would conflate "swap broken" with "eligibility gate".
const cardById = Object.fromEntries(cards.map((c) => [c.id, c]));
const pairs = [[cardById['hero-giggiolillo'].id, slots[0]], [cardById['hero-sir-spaccaculi'].id, slots[1]]];
for (const [cardId, slot] of pairs) {
  const card = await page.evaluate((id) => {
    const el = document.querySelector(`[data-resident-id="${id}"]`);
    if (!el) return null; const r = el.getBoundingClientRect();
    return { id, x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, cardId);
  if (!card) { console.error('card gone:', cardId); continue; }
  await page.mouse.move(card.x, card.y); await page.mouse.down(); await sleep(260);
  await page.mouse.move(card.x + 30, card.y + 15, { steps: 4 }); await sleep(60);
  await page.mouse.move(slot.x, slot.y, { steps: 8 }); await sleep(60); await page.mouse.up();
  await sleep(2200);
  console.log('assigned', card.id, '->', slot.id);
}
const before = await occupants();
console.log('BEFORE:', JSON.stringify(before));

// locate the two slot tokens
const toks = await page.evaluate(() =>
  [...document.querySelectorAll('[data-testid^="slot-token-"]')].slice(0, 2).map((el) => {
    const r = el.getBoundingClientRect();
    return { testid: el.getAttribute('data-testid'), x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }));
console.log('tokens:', JSON.stringify(toks));
if (toks.length < 2) { console.error('FAIL: need 2 occupied slots'); await browser.close(); process.exit(1); }

// drag token[0] onto token[1] (occupied slot) — must MOVE (drag, not hold)
await page.mouse.move(toks[0].x, toks[0].y); await page.mouse.down(); await sleep(120);
await page.mouse.move(toks[0].x + 15, toks[0].y + 8, { steps: 4 }); await sleep(80);
await page.mouse.move(toks[1].x, toks[1].y, { steps: 10 }); await sleep(200);
const midDrag = await page.evaluate(() => ({
  ghost: !!document.querySelector('[class*="ghost" i], [data-testid*="ghost"]'),
  overlay: [...document.querySelectorAll('[data-dnd-overlay] img')].map(i => i.src.split('/').pop()),
}));
await page.mouse.up();
await sleep(2500);
const after = await occupants();
console.log('MID-DRAG:', JSON.stringify(midDrag));
console.log('AFTER:', JSON.stringify(after));
await page.screenshot({ path: path.join(OUT, 'v5-swap2-after.png') });
// verdict: occupants swapped?
const occ = (list) => Object.fromEntries(list.map(s => [s.slot, s.occupant]));
const b = occ(before), a = occ(after);
const occupied = Object.keys(b).filter((k) => b[k]);
const swapped = occupied.length >= 2 && occupied.every((k) => {
  const partner = occupied.find((k2) => k2 !== k);
  return a[k] === b[partner] && a[partner] === b[k];
});
const report = { interactiveMs: im, before, after, midDrag, swapped };
writeFileSync(path.join(OUT, 'swap2.json'), JSON.stringify(report, null, 2));
console.log(swapped ? 'SWAP CONFIRMED' : 'SWAP NOT OBSERVED');
await browser.close();
