// Drag/open latency probe for medallion portraits on /game (prod).
// Portraits are NOT warmed on game-mappa2 (only cursors are): the first fetch
// happens when the roster panel mounts. Measures:
//   1) roster-open latency: keypress 'r' → all medallion/portrait imgs complete
//   2) drag-overlay latency: during a real drag, is the overlay portrait
//      already complete at mount (cache hit) or fetched in flight?
// Usage: node scripts/_tmp-probe-drag.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const url = 'https://rpg-balancer.vercel.app/game';
const OUT = '.mw/runs/plan126-boot-bytes/component-audit';
mkdirSync(OUT, { recursive: true });

const SEED_RESIDENTS = [
  { id: 'probe-1', name: 'Sir Spaccaculi', visualProfileId: 'sir-spaccaculi', aiBehavior: 'balanced',
    statBlock: { hp: 280, strength: 8, endurance: 8, agility: 4, intelligence: 3, perception: 5 },
    equippedSpellIds: [], status: 'available', fatigue: 0, currentHp: 280, maxHp: 280,
    isInjured: false, isHero: true, survivalCount: 7, survivalScore: 540 },
  { id: 'probe-2', name: 'Giggiolillo', visualProfileId: 'giggiolillo', aiBehavior: 'balanced',
    statBlock: { hp: 195, strength: 6, endurance: 4, agility: 9, intelligence: 3, perception: 6 },
    equippedSpellIds: [], status: 'available', fatigue: 0, currentHp: 195, maxHp: 195,
    isInjured: false, isHero: false, survivalCount: 4, survivalScore: 300 },
  { id: 'probe-3', name: 'Bertoldo', visualProfileId: 'villager-bertoldo', aiBehavior: 'balanced',
    statBlock: { hp: 120, strength: 5, endurance: 5, agility: 5, intelligence: 4, perception: 5 },
    equippedSpellIds: [], status: 'available', fatigue: 0, currentHp: 120, maxHp: 120,
    isInjured: false, isHero: false, survivalCount: 0, survivalScore: 0 },
];

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.addInitScript((dataset) => {
  localStorage.setItem('idle_combat_characters', JSON.stringify(dataset));
}, SEED_RESIDENTS);

const portraitNet = [];
page.on('response', (r) => {
  if (/portrait|medal/i.test(r.url())) {
    portraitNet.push({ url: r.url().split('/').pop(), atMs: Math.round(performance.now()), status: r.status() });
  }
});

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
let interactiveMs = null;
while (Date.now() - t0 < 120000) {
  interactiveMs = await page.evaluate(() => window.__gameBoot?.interactiveMs > 0 ? window.__gameBoot.interactiveMs : null);
  if (interactiveMs !== null) break;
  await page.waitForTimeout(2000);
}
if (interactiveMs === null) { console.error('TIMEOUT'); process.exit(1); }
await page.waitForTimeout(2000);

// --- 1) Roster open latency ---
const imgState = () => page.evaluate(() =>
  [...document.querySelectorAll('img')].map((el) => ({
    src: (el.currentSrc || el.src).split('/').pop().split('?')[0],
    loaded: el.complete && el.naturalWidth > 0,
    kind: (el.src.includes('ring.webp') ? 'ring' : /portrait|medal/i.test(el.src) ? 'portrait' : 'other'),
  })));

const openStart = Date.now();
await page.keyboard.press('r');
await page.waitForTimeout(300);
const rosterMountedAt = await page.evaluate(() => {
  const rings = document.querySelectorAll('img[src*="ring.webp"]').length;
  return { rings };
});
// poll until all medallion+portrait imgs complete (max 5s)
let allComplete = false, openLatencyMs = null;
for (let i = 0; i < 50; i++) {
  const st = await imgState();
  const rel = st.filter((i) => i.kind !== 'other');
  if (rel.length > 0 && rel.every((i) => i.loaded)) { allComplete = true; openLatencyMs = Date.now() - openStart; break; }
  await page.waitForTimeout(100);
}
const afterOpen = await imgState();
await page.screenshot({ path: path.join(OUT, 'roster-open.png') });

// --- 2) Drag overlay latency ---
let drag = { attempted: false };
const ringImg = page.locator('img[src*="ring.webp"]').first();
if ((await ringImg.count()) > 0) {
  // Walk to the draggable card: the roster card root is a few levels up.
  const box = await ringImg.boundingBox();
  if (box) {
    drag.attempted = true;
    const sx = box.x + box.width / 2, sy = box.y + box.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.waitForTimeout(60);
    await page.mouse.move(sx + 60, sy + 30, { steps: 5 });
    const dragStart = Date.now();
    // Overlay img state sampled immediately after movement starts.
    const overlayAtMount = await page.evaluate(() => {
      const portal = [...document.querySelectorAll('body > *')].at(-1);
      const imgs = [...document.querySelectorAll('img')].filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && (cs.position === 'fixed' || el.closest('[style*="fixed"], [class*="verlay"]'));
      });
      return imgs.map((el) => ({ src: (el.currentSrc || el.src).split('/').pop().split('?')[0], loaded: el.complete && el.naturalWidth > 0 }));
    });
    drag.overlayAtMount = overlayAtMount;
    drag.sampleAtMs = Date.now() - dragStart;
    await page.mouse.move(sx + 200, sy + 100, { steps: 6 });
    await page.screenshot({ path: path.join(OUT, 'drag-mid.png') });
    const overlayLater = await page.evaluate(() =>
      [...document.querySelectorAll('img')].filter((el) => /portrait|medal|ring/i.test(el.src)).map((el) => ({
        src: el.src.split('/').pop().split('?')[0], loaded: el.complete && el.naturalWidth > 0 })));
    drag.allMedalImgsDuringDrag = overlayLater;
    await page.mouse.up();
  }
}

const report = {
  interactiveMs,
  rosterOpen: { mounted: rosterMountedAt, allComplete, openLatencyMs, imgsAfterOpen: afterOpen },
  drag,
  portraitNetworkFetches: portraitNet,
  note: 'portraitNet[] = network fetches for portrait/medal URLs with page-time ms; empty at boot = not warmed on /game',
};
writeFileSync(path.join(OUT, 'drag-latency.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
