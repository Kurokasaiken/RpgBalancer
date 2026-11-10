#!/usr/bin/env node
/**
 * measure-hud-slots.mjs — HUD Zanara target board.
 * Captures /game at 1600x900 (base, roster open, expedition detail open) and
 * dumps the bounding boxes of the real HUD components, so the target board
 * places mockup references in the REAL slots instead of the mockups' layout.
 * Usage: node scripts/measure-hud-slots.mjs [baseUrl]
 * Out: .mw/specs/hud-zanara/target/{slots.json, game-*.png}
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.mw/specs/hud-zanara/target');
const BASE_URL = process.argv[2] ?? 'http://localhost:5173';

const SELECTORS = {
  objective: '[aria-labelledby="hud-objective-label"]',
  nextEvent: '[data-testid="hud-next-tab"]',
  plaques: '[data-skin="hud-plaque"]',
  nav: 'nav',
  corner: '[data-hud-corner]',
  roster: '[data-stage-panel="roster"], [data-testid="resident-roster-panel"]',
  questDetail: '[data-testid="quest-expedition-detail"]',
  poi: '[data-testid="map-quest-poi"]',
  strips: '[data-hud-strip-tab], [data-stage-rail]',
  hudControls: '[data-hud-controls]',
};

const measure = (page) => page.evaluate((sels) => {
  const out = {};
  for (const [k, s] of Object.entries(sels)) {
    out[k] = [...document.querySelectorAll(s)].map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        tag: el.tagName.toLowerCase(), shape: el.getAttribute('data-shape') ?? undefined,
        text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 60) };
    }).filter((r) => r.w > 4 && r.h > 4);
  }
  return out;
}, SELECTORS);

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(`${BASE_URL}/gameOld`);
await page.waitForFunction(() => Boolean(window.__idleVillageTestHooks?.expedition), undefined, { timeout: 60_000 });
await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), undefined, { timeout: 30_000 }).catch(() => {});
await page.waitForTimeout(3000);
const result = { viewport: [1600, 900], base: await measure(page) };
await page.screenshot({ path: join(OUT, 'game-base.png') });

await page.keyboard.press('r');
await page.waitForTimeout(1200);
result.rosterOpen = await measure(page);
await page.screenshot({ path: join(OUT, 'game-roster.png') });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

const poiIds = await page.evaluate(() => Object.keys(window.__idleVillageTestHooks?.expedition ?? {}));
if (poiIds[0]) {
  await page.evaluate((poi) => window.__idleVillageTestHooks.expedition[poi]?.openDetail?.(), poiIds[0]);
  await page.waitForTimeout(1200);
  result.detailOpen = await measure(page);
  await page.screenshot({ path: join(OUT, 'game-detail.png') });
}
writeFileSync(join(OUT, 'slots.json'), JSON.stringify(result, null, 2));
console.log('poi hooks:', poiIds.join(', '));
await browser.close();
