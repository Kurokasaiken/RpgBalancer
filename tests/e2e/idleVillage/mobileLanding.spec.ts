/**
 * mobileLanding.spec.ts — R-297 regression contract.
 *
 * On mobile (viewport <= 767px, `useIsMobile`) the root path `/` is the
 * mappa2 lab page: `App.tsx` renders `Mappa2LabPage` and canonicalizes the
 * URL to `/mappa2-lab`. On desktop `/` keeps the game frame.
 *
 * Witnesses: `body[data-mappa2-lab]` (set by the lab page on mount) and the
 * title/boot screen of the game entry — a real browser check, not a diff.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = 'test-results/r297-mobile-landing-mappa2-lab';
const LAB_MARKER = 'body[data-mappa2-lab="true"]';
const GAME_MARKERS = '[data-testid="title-screen"], [data-testid="game-boot-screen"], canvas';

test.describe('Mobile landing: / is the mappa2 lab (R-297)', () => {
  test('mobile viewport: / renders the mappa2 lab and canonicalizes the URL', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.waitForSelector(LAB_MARKER, { timeout: 90000 });
    await expect(page).toHaveURL(/\/mappa2-lab/);
    // Pixi mounted: the lab canvas exists.
    await page.waitForSelector('canvas', { timeout: 90000 });

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-root-mappa2-lab.png') });
  });

  test('mobile viewport: /mappa2-lab directly still works', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/mappa2-lab');
    await page.waitForSelector(LAB_MARKER, { timeout: 90000 });
    await expect(page).toHaveURL(/\/mappa2-lab/);
  });

  test('desktop viewport: / keeps the game frame (no lab)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await page.waitForSelector(GAME_MARKERS, { timeout: 90000 });
    await expect(page).not.toHaveURL(/\/mappa2-lab/);
    const labMarker = await page.evaluate(() => document.body.dataset.mappa2Lab === 'true');
    expect(labMarker).toBe(false);

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-root-game.png') });
  });
});
