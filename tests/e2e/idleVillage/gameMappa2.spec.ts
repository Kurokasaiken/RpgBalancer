/**
 * gameMappa2.spec.ts — `/game` is the approved mappa2 + the three signed HUD surfaces (2026-11-10);
 * the previous game page answers on `/gameOld`.
 *
 * Runs against the dev server (playwright.dev-server.config.ts → :5173).
 */
import { test, expect } from '@playwright/test';

test.describe('/game — mappa2 + signed HUD (2026-11-10)', () => {
  test('boots the mappa2 map with time, resources and nav; nav switches to the village and back', async ({ page }) => {
    test.setTimeout(300_000); // mappa2 boot in headless takes minutes, like the other mappa2 specs (180 s ready budget)
    // the dev server serves hundreds of modules: keep every resource entry so the manifest check below sees it
    await page.addInitScript(() => performance.setResourceTimingBufferSize(20_000));
    await page.goto('/game', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const root = page.locator('[data-testid="game-mappa2"]');
    await expect(root).toBeVisible({ timeout: 60_000 });
    await expect(root).toHaveAttribute('data-map-ready', 'true', { timeout: 180_000 });
    await expect(page.locator('[data-testid="world-map-layer"] canvas').first()).toBeVisible();
    for (const slot of ['time', 'resources', 'nav']) {
      await expect(page.locator(`[data-hudslot="${slot}"]`)).toBeVisible();
    }
    // the map is mappa2, not the old wanderlust world
    const manifests = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes('manifest.json')));
    expect(manifests.some((n) => n.includes('/mappa2/base/manifest.json'))).toBe(true);
    expect(manifests.some((n) => n.includes('/wanderlust/'))).toBe(false);

    await page.locator('[data-nav-id="village"]').click();
    await expect(root).toHaveAttribute('data-view', 'village');
    await expect(page.locator('[data-testid="world-map-layer"]')).toHaveAttribute('aria-hidden', 'true');
    await page.locator('[data-nav-id="map"]').click();
    await expect(root).toHaveAttribute('data-view', 'map');
  });

  test('/gameOld still serves the previous game page', async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto('/gameOld', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.locator('[data-testid="world-map-layer"] canvas').first()).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('[data-testid="game-mappa2"]')).toHaveCount(0);
  });
});
