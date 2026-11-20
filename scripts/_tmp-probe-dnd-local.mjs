// Full drag&drop regression probe on prod /game. Exercises:
//  B-A wrong portrait at drag start (warm node patch)
//  B-B drop commits far from any slot (magnet radius)
//  B-C slot-token swap on occupied slot
//  B-D medallion disappears while extracting (press&hold on assigned token)
//  B-E ghost assignment (locked but unseated)
// Usage: node scripts/_tmp-probe-dnd-regressions.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const url = 'http://localhost:4173/game';
const OUT = '.mw/bugs/20261118-medallion-drag/evidence';
mkdirSync(OUT, { recursive: true });

const SEED = [
  { id: 'probe-1', name: 'Sir Spaccaculi', visualProfileId: 'sir-spaccaculi', aiBehavior: 'balanced',
    statBlock: { hp: 280, strength: 9, endurance: 9, agility: 6, intelligence: 5, perception: 6 },
    equippedSpellIds: [], status: 'available', fatigue: 0, currentHp: 280, maxHp: 280,
    isInjured: false, isHero: true, survivalCount: 7, survivalScore: 540 },
  { id: 'probe-2', name: 'Giggiolillo', visualProfileId: 'giggiolillo', aiBehavior: 'balanced',
    statBlock: { hp: 195, strength: 8, endurance: 6, agility: 9, intelligence: 5, perception: 7 },
    equippedSpellIds: [], status: 'available', fatigue: 0, currentHp: 195, maxHp: 195,
    isInjured: false, isHero: false, survivalCount: 4, survivalScore: 300 },
  { id: 'probe-3', name: 'Bertoldo', visualProfileId: 'villager-bertoldo', aiBehavior: 'balanced',
    statBlock: { hp: 160, strength: 6, endurance: 6, agility: 6, intelligence: 6, perception: 6 },
    equippedSpellIds: [], status: 'available', fatigue: 0, currentHp: 160, maxHp: 160,
    isInjured: false, isHero: false, survivalCount: 0, survivalScore: 0 },
  { id: 'probe-4', name: 'Lisetta', visualProfileId: 'villager-lisetta', aiBehavior: 'balanced',
    statBlock: { hp: 150, strength: 5, endurance: 5, agility: 7, intelligence: 7, perception: 7 },
    equippedSpellIds: [], status: 'available', fatigue: 0, currentHp: 150, maxHp: 150,
    isInjured: false, isHero: false, survivalCount: 0, survivalScore: 0 },
  { id: 'probe-5', name: 'Manno', visualProfileId: 'villager-manno', aiBehavior: 'balanced',
    statBlock: { hp: 140, strength: 5, endurance: 6, agility: 5, intelligence: 5, perception: 5 },
    equippedSpellIds: [], status: 'available', fatigue: 0, currentHp: 140, maxHp: 140,
    isInjured: false, isHero: false, survivalCount: 0, survivalScore: 0 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dragTo(page, box, tx, ty, holdMs = 260) {
  const sx = box.x + box.w / 2, sy = box.y + box.h / 2;
  if (![sx, sy, tx, ty].every(Number.isFinite)) throw new Error(`dragTo NaN: ${JSON.stringify({ box, tx, ty })}`);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await sleep(holdMs);
  await page.mouse.move(sx + 30, sy + 15, { steps: 4 });
  await sleep(60);
  await page.mouse.move(tx, ty, { steps: 8 });
  await sleep(60);
  await page.mouse.up();
}

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.addInitScript((d) => { localStorage.setItem('idle_combat_characters', JSON.stringify(d)); }, SEED);

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
let interactiveMs = null;
while (Date.now() - t0 < 120000) {
  interactiveMs = await page.evaluate(() => window.__gameBoot?.interactiveMs > 0 ? window.__gameBoot.interactiveMs : null);
  if (interactiveMs !== null) break;
  await sleep(2000);
}
if (!interactiveMs) { console.error('TIMEOUT'); process.exit(1); }
await sleep(2000);

const report = { interactiveMs };
const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });

// Open roster
await page.keyboard.press('r');
await sleep(1200);

// Open expedition cassetto via POI marker
const pois = page.locator('[data-testid="map-quest-poi"]');
report.poiCount = await pois.count();
for (let i = 0; i < report.poiCount; i++) {
  await pois.nth(i).click({ force: true });
  await sleep(1500);
  if ((await page.locator('[data-slot-id]').count()) > 0) { report.openedPoi = i; break; }
}
report.slotCount = await page.locator('[data-slot-id]').count();
console.log('POIs:', report.poiCount, 'openedPoi:', report.openedPoi, 'slotCount:', report.slotCount);
await shot('01-cassetto');

// Resident cards
const cards = await page.evaluate(() =>
  [...document.querySelectorAll('[data-resident-id]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.getAttribute('data-resident-id'), x: r.x, y: r.y, w: r.width, h: r.height };
  }).filter((c) => c.w > 0));
report.cards = cards;

// Slot boxes
const slots = await page.evaluate(() =>
  [...document.querySelectorAll('[data-slot-id]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.getAttribute('data-slot-id'), x: r.x, y: r.y, w: r.width, h: r.height };
  }).filter((s) => s.w > 0));
report.slots = slots;
const slotState = () => page.evaluate(() =>
  [...document.querySelectorAll('[data-slot-id]')].map((el) => {
    const medal = el.querySelector('[data-testid^="slot-medal-"] img');
    const token = el.querySelector('[data-testid^="slot-token-"]');
    return { slot: el.getAttribute('data-slot-id'), occupant: token?.getAttribute('aria-label') ?? medal?.getAttribute('alt') ?? null };
  }));

// ---- B-A: warm node portrait vs dragged card ----
if (cards.length) {
  const c = cards[0];
  await page.mouse.move(c.x + c.w / 2, c.y + c.h / 2);
  await page.mouse.down();
  await sleep(300);
  await page.mouse.move(c.x + 60, c.y + 30, { steps: 4 });
  await sleep(250);
  report.ba = await page.evaluate(() => {
    const warm = document.querySelector('[data-drag-warm-mount]');
    const warmImg = warm?.querySelector('img');
    const overlay = document.querySelector('[data-dnd-overlay]');
    return {
      warmVisible: warm ? getComputedStyle(warm).visibility : null,
      warmDebugId: warm?.getAttribute('data-debug-active-id') ?? null,
      warmImgSrc: warmImg?.getAttribute('src')?.split('/').pop() ?? null,
      warmImgCount: warm?.querySelectorAll('img').length ?? 0,
      realOverlayDebugId: overlay?.getAttribute('data-debug-active-id') ?? null,
      realOverlayImgs: overlay ? [...overlay.querySelectorAll('img')].map((i) => i.src.split('/').pop()) : [],
    };
  });
  await shot('02-drag-start');
  await page.mouse.up();
  await sleep(800);
}

// ---- Assign residents to first two slots ----
console.log('cards:', cards.length, 'slots:', slots.length);
if (cards.length >= 2 && slots.length >= 2) {
  for (let i = 0; i < 2; i++) {
    const cardBoxes = await page.evaluate(() =>
      [...document.querySelectorAll('[data-resident-id]')].map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute('data-resident-id'), x: r.x, y: r.y, w: r.width, h: r.height };
      }).filter((c) => c.w > 0));
    const free = cardBoxes.filter((c) => !['probe-1', 'probe-2'].slice(0, i).includes(c.id));
    const target = free[i] ?? cardBoxes[i];
    if (!target) { console.log('no free card for assign', i); break; }
    console.log('assign drag:', target.id, '→', slots[i].id);
    await dragTo(page, target, slots[i].x + slots[i].w / 2, slots[i].y + slots[i].h / 2);
    await sleep(1400); // flight + commit
  }
  report.afterAssign = await slotState();
  console.log('afterAssign:', JSON.stringify(report.afterAssign));
  await shot('03-assigned');
}

// ---- B-C: swap — drag token of slot0 onto slot1 ----
const tokens0 = await page.evaluate(() =>
  [...document.querySelectorAll('[data-testid^="slot-token-"]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { testid: el.getAttribute('data-testid'), x: r.x, y: r.y, w: r.width, h: r.height };
  }));
report.tokensBeforeSwap = tokens0;
if (slots.length >= 2 && tokens0.length) {
  const tokenA = tokens0[0];
  await dragTo(page, tokenA, slots[1].x + slots[1].w / 2, slots[1].y + slots[1].h / 2, 300);
  await sleep(1600);
  report.bc = { afterSwap: await slotState() };
  await shot('04-after-swap');
}

// ---- B-B: far drop — drag a free roster card onto open sea ----
const mid = { x: 800, y: 200 };
const freeCards = await page.evaluate(() =>
  [...document.querySelectorAll('[data-resident-id]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.getAttribute('data-resident-id'), x: r.x, y: r.y, w: r.width, h: r.height };
  }).filter((c) => c.w > 0));
const unused = freeCards.find((c) => !(report.afterAssign ?? []).some((s) => s.occupant === c.id) && c.id !== 'probe-1' && c.id !== 'probe-2');
if (unused) {
  await dragTo(page, unused, mid.x, mid.y);
  await sleep(1500);
  report.bb = { droppedOn: 'open-sea(800,200)', afterFarDrop: await slotState() };
  await shot('05-far-drop');
}

// ---- B-D: extract — press & hold on an assigned token ----
const tokensNow = await page.evaluate(() =>
  [...document.querySelectorAll('[data-testid^="slot-token-"]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { testid: el.getAttribute('data-testid'), x: r.x, y: r.y, w: r.width, h: r.height };
  }));
if (tokensNow.length) {
  const tok = tokensNow[0];
  await page.mouse.move(tok.x + tok.w / 2, tok.y + tok.h / 2);
  await page.mouse.down();
  await sleep(700); // extraction hold
  report.bd = { duringHold: await page.evaluate(() => {
    const medal = document.querySelector('[data-testid^="slot-medal-"]');
    const ghost = document.querySelector('[data-testid="slot-token-ghost"]');
    const flight = document.querySelectorAll('[data-flight-proxy], [data-testid*="flight"], [class*="FlightProxy"]');
    return {
      medalVisible: medal ? getComputedStyle(medal).opacity : null,
      ghostPresent: !!ghost,
      flightNodes: flight.length,
    };
  }) };
  await shot('06-during-extract');
  await page.mouse.move(tok.x - 300, tok.y - 100, { steps: 6 });
  await sleep(300);
  await page.mouse.up();
  await sleep(1800);
  report.bd.afterExtract = await slotState();
  await shot('07-after-extract');
}

report.finalSlotState = await slotState();
writeFileSync(path.join(OUT, 'dnd-regressions.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
