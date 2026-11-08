#!/usr/bin/env node
/**
 * capture-panels-inventory.mjs — PLAN-113 F0.
 *
 * Headless capture matrix of every /game surface reachable WITHOUT fixtures,
 * at a canonical viewport, into test-results/plan113-inventory/.
 * WebGL enabled (--enable-unsafe-swiftshader, R-304).
 *
 * Pass 1 (reachable via shortcuts/hooks): base, roster, stash, triad A
 * (roster+stash+questDetail — authorizedPairs + centerStage), heroSheet,
 * events, merchant, + hud-compose views for the current-chrome baseline.
 * Surfaces requiring saved-state fixtures (B run cluster, F ceremonies,
 * C village view, G menu) are listed in FIXTURE_TODO.
 *
 * Usage: node scripts/hud-real/capture-panels-inventory.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'test-results/plan113-inventory');
const BASE_URL = process.argv[2] ?? 'http://localhost:5173';
const VW = Number(process.env.CAP_W ?? 1920);
const VH = Number(process.env.CAP_H ?? 1080);
const POI = 'poi-goblin';

const FIXTURE_TODO = [
  'B1-quest-run-cluster (quest active)', 'B2-skill-check', 'B6-verdict', 'B7-popup',
  'C1-village-view', 'F1-level-ceremony', 'F2-settlement-lost', 'F3-game-over',
  'F5-invasion-shroud', 'G2-menu', 'G3-load', 'G4-settings',
];

const shot = async (page, name) => {
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(name);
};

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 160)); });

  await page.goto(`${BASE_URL}/game`);
  await page.waitForFunction(() => {
    const exp = window.__idleVillageTestHooks?.expedition;
    return Boolean(exp && exp['poi-goblin']);
  }, undefined, { timeout: 45_000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), undefined, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2500);

  await shot(page, '01-base-chrome');

  // A1 roster
  await page.keyboard.press('r');
  await page.waitForSelector('[data-testid="resident-roster-panel"], [data-stage-panel="roster"]', { timeout: 15_000 }).catch(() => console.warn('roster missing'));
  await shot(page, '02-A1-roster');

  // A1+A2 authorized pair
  await page.keyboard.press('v');
  await page.waitForTimeout(600);
  await shot(page, '03-A1A2-roster-stash-pair');

  // A3 planner — triad composition (roster+stash+questDetail)
  await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.openDetail?.(), POI);
  await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 15_000 }).catch(() => console.warn('questDetail missing'));
  await shot(page, '04-A-triad-roster-stash-planner');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await shot(page, '05-A1A2-pair-after-detail-close');

  // A4 hero sheet
  await page.keyboard.press('p');
  await page.waitForTimeout(600);
  await shot(page, '06-A4-hero-sheet');
  await page.keyboard.press('p');
  await page.waitForTimeout(300);

  // close all, then E1 events
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.keyboard.press('e');
  await page.waitForTimeout(600);
  await shot(page, '07-E1-events-ledger');
  await page.keyboard.press('e');
  await page.waitForTimeout(300);

  // D1 merchant
  await page.keyboard.press('m');
  await page.waitForTimeout(600);
  await shot(page, '08-D1-merchant');
  await page.keyboard.press('m');
  await page.waitForTimeout(300);

  // A2 stash alone
  await page.keyboard.press('v');
  await page.waitForTimeout(600);
  await shot(page, '09-A2-stash-alone');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // hud-compose current chrome baseline (3 views)
  for (const v of ['overview', 'context', 'narrative']) {
    await page.goto(`${BASE_URL}/hud-compose?view=${v}`);
    await page.waitForTimeout(2500);
    await shot(page, `10-compose-${v}`);
  }

  await browser.close();
  console.log('FIXTURE_TODO:', JSON.stringify(FIXTURE_TODO));
};

main().catch((err) => { console.error(err); process.exit(1); });
