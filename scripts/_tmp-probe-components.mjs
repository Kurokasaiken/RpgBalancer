// Component-load audit for /game (prod): after boot is declared interactive,
// walks every <img> in the DOM and every CSS background-image URL, cross-checks
// them against network failures, and captures witness screenshots.
// Usage: node scripts/_tmp-probe-components.mjs [url]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const url = process.argv.find((a) => !a.startsWith('-') && a.startsWith('http')) ?? 'https://rpg-balancer.vercel.app/game';
const withResidents = process.argv.includes('--residents');
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
if (withResidents) {
  await page.addInitScript((dataset) => {
    localStorage.setItem('idle_combat_characters', JSON.stringify(dataset));
  }, SEED_RESIDENTS);
}

const responses = new Map();
const failed = [];
page.on('response', (r) => {
  responses.set(r.url(), r.status());
  if (r.status() >= 400) failed.push({ url: r.url(), status: r.status() });
});
page.on('requestfailed', (r) => failed.push({ url: r.url(), status: `FAILED:${r.failure()?.errorText ?? '?'}` }));
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

let interactiveMs = null;
while (Date.now() - t0 < 120000) {
  interactiveMs = await page.evaluate(() => window.__gameBoot?.interactiveMs > 0 ? window.__gameBoot.interactiveMs : null);
  if (interactiveMs !== null) break;
  await page.waitForTimeout(2000);
}
if (interactiveMs === null) { console.error('TIMEOUT — veil never lifted'); process.exit(1); }

await page.waitForTimeout(1500); // settle: last mounts/opacity transitions
await page.screenshot({ path: path.join(OUT, 'game-ready.png') });

// With residents seeded, open the quest-POI cassetto: it mounts the
// ResidentSlotRack (medallion + portrait per resident).
let cassettoOpened = false;
if (withResidents) {
  const poi = page.locator('[data-testid="map-quest-poi"]').first();
  if (await poi.count() > 0) {
    await poi.click({ force: true }).catch(() => {});
    await page.waitForTimeout(2500);
    cassettoOpened = (await page.locator('[data-testid="expedition-sheet"], [data-testid="hud-real-cassetto"], [data-cassetto-detail]').count()) > 0;
    if (cassettoOpened) await page.screenshot({ path: path.join(OUT, 'cassetto-open.png') });
  }
}

const audit = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].map((el) => {
    const r = el.getBoundingClientRect();
    const src = el.currentSrc || el.src;
    return {
      src: src.split('?')[0],
      loaded: el.complete && el.naturalWidth > 0,
      naturalWidth: el.naturalWidth,
      cssW: Math.round(r.width), cssH: Math.round(r.height),
      inViewport: r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && r.width > 0,
      hidden: r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === 'hidden',
      kind: src.includes('ring.webp') ? 'medallion-ring'
        : /portrait|medal/i.test(src) ? 'portrait'
        : src.includes('/assets/ui/') ? 'ui-asset' : 'other',
      x: Math.round(r.x), y: Math.round(r.y),
    };
  });
  const bgUrls = new Set();
  for (const el of document.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage;
    for (const m of bg.matchAll(/url\(["']?([^"')]+)/g)) bgUrls.add(m[1].split('?')[0]);
  }
  return { imgs, bgUrls: [...bgUrls], imgCount: imgs.length };
});

const brokenImgs = audit.imgs.filter((i) => !i.loaded);
const brokenBg = audit.bgUrls.filter((u) => (responses.get(u) ?? 200) >= 400);
const medallions = audit.imgs.filter((i) => i.kind === 'medallion-ring');
const portraits = audit.imgs.filter((i) => i.kind === 'portrait');

// Witness crop on the first visible medallion cluster (padded).
let cropPath = null;
const visMed = medallions.find((i) => i.inViewport);
if (visMed) {
  const x = Math.max(0, visMed.x - 120), y = Math.max(0, visMed.y - 120);
  cropPath = path.join(OUT, 'medallion-crop.png');
  await page.screenshot({ path: cropPath, clip: { x, y, width: Math.min(480, 1600 - x), height: Math.min(480, 900 - y) } });
}

const report = {
  url, interactiveMs, wallClockMs: Date.now() - t0,
  withResidents, cassettoOpened,
  requests: responses.size,
  httpFailures: failed,
  consoleErrors, pageErrors,
  imgs: {
    total: audit.imgCount,
    medallionRings: { total: medallions.length, visible: medallions.filter((i) => i.inViewport).length, broken: medallions.filter((i) => !i.loaded).length },
    portraits: { total: portraits.length, visible: portraits.filter((i) => i.inViewport).length, broken: portraits.filter((i) => !i.loaded).length },
    broken: brokenImgs,
    cssBackgrounds: { total: audit.bgUrls.length, broken: brokenBg },
  },
};
writeFileSync(path.join(OUT, 'component-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(brokenImgs.length + brokenBg.length + failed.length > 0 ? 1 : 0);
