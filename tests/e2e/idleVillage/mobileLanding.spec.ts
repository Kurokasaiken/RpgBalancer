/**
 * mobileLanding.spec.ts — R-328 regression contract.
 *
 * The root path `/` lands on the game surface (GameMappa2Page: mappa2
 * approved + HUD) on EVERY device — supersedes R-297/R-305, which had moved
 * the landing to `/mappa2-lab` (mobile, then all devices + URL rewrite).
 * `/mappa2-lab` stays reachable on its own route.
 *
 * Witnesses: the game entry boot markers (title/boot screen, world canvas)
 * and the ABSENCE of `body[data-mappa2-lab]` — a real browser check.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const EVIDENCE_DIR = 'test-results/r328-root-landing-game';
const LAB_MARKER = 'body[data-mappa2-lab="true"]';
const GAME_MARKERS = '[data-testid="title-screen"], [data-testid="game-boot-screen"], canvas';

test.describe('Root landing: / is the game surface (R-328)', () => {
  test('mobile viewport: / renders the game surface, no lab, no URL rewrite', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.waitForSelector(GAME_MARKERS, { timeout: 90000 });
    await expect(page).not.toHaveURL(/\/mappa2-lab/);
    const labMarker = await page.evaluate(() => document.body.dataset.mappa2Lab === 'true');
    expect(labMarker).toBe(false);

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'mobile-root-game.png') });
  });

  test('desktop viewport: / renders the game surface, no lab', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await page.waitForSelector(GAME_MARKERS, { timeout: 90000 });
    await expect(page).not.toHaveURL(/\/mappa2-lab/);
    const labMarker = await page.evaluate(() => document.body.dataset.mappa2Lab === 'true');
    expect(labMarker).toBe(false);

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'desktop-root-game.png') });
  });

  test('/mappa2-lab direct still renders the lab', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/mappa2-lab');
    await page.waitForSelector(LAB_MARKER, { timeout: 90000 });
    await expect(page).toHaveURL(/\/mappa2-lab/);
  });
});
