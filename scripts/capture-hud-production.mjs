#!/usr/bin/env node
/**
 * capture-hud-production.mjs — R-303 /hud-lab.
 *
 * Screenshots the production /game surface at a fixed viewport into
 * public/mockups/hud-lab/sources/production-*.png, which
 * scripts/build-hud-lab-crops.mjs then crops into "Produzione" iterations.
 *
 * States captured:
 *   production-base.png    — HUD as loaded (top tabs, nav plinth, corner cluster)
 *   production-roster.png  — roster panel open ('r' hotkey)
 *   production-panel.png   — quest expedition detail open (test hook)
 *
 * Usage: node scripts/capture-hud-production.mjs [baseUrl]
 * Requires a dev server at http://localhost:5173 (or the URL passed).
 */
import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/mockups/hud-lab/sources');
const BASE_URL = process.argv[2] ?? 'http://localhost:5173';
const POI = 'poi-goblin';

const main = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 160)); });

  await page.goto(`${BASE_URL}/game`);
  await page.waitForFunction(() => {
    const exp = window.__idleVillageTestHooks?.expedition;
    return Boolean(exp && exp['poi-goblin'] && exp['poi-rovine']);
  }, undefined, { timeout: 45_000 });
  // Boot veil lifts when assets are ready; give the map a beat to paint.
  await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), undefined, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2500);

  await page.screenshot({ path: join(OUT, 'production-base.png') });
  console.log('production-base.png');

  await page.keyboard.press('r');
  await page.waitForSelector('[data-testid="resident-roster-panel"], [data-stage-panel="roster"]', { timeout: 15_000 }).catch(() => console.warn('roster panel did not appear'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, 'production-roster.png') });
  console.log('production-roster.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.openDetail?.(), POI);
  await page.waitForSelector('[data-testid="quest-expedition-detail"]', { timeout: 15_000 }).catch(() => console.warn('expedition detail did not appear'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, 'production-panel.png') });
  console.log('production-panel.png');

  await browser.close();
};

main().catch((err) => { console.error(err); process.exit(1); });
