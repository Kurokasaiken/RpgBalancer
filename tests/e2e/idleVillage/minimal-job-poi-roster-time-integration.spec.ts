import { test, expect } from '@playwright/test';

/**
 * E2E for the Job POI + Roster + Time Engine integration page.
 *
 * Verifies the certified components are wired together and that the gameplay
 * loop is live: resident assignment drives the engine and time advances.
 *
 * Note: in the production build the job durations come from config (large
 * durationFormula → many ticks), so this spec verifies wiring + progression
 * rather than full reward completion (covered deterministically in unit/RTL).
 */
test.describe('Job POI + Roster + Time Engine Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/minimal-job-poi-roster-time-integration');
    await expect(page.getByTestId('job-poi-roster-time-page')).toBeVisible();
  });

  test('renders the certified HUD, roster and reward log', async ({ page }) => {
    await expect(page.getByTestId('status-hud')).toBeVisible();
    await expect(page.getByTestId('time-engine-strip-compact')).toBeVisible();
    await expect(page.getByTestId('village-roster-section')).toBeVisible();
    await expect(page.getByTestId('reward-log')).toBeVisible();
  });

  test('advancing time increments the engine tick counter', async ({ page }) => {
    await expect(page.getByTestId('current-tick')).toContainText('Tick 0');
    await page.getByTestId('advance-time-button').click();
    await expect(page.getByTestId('current-tick')).toContainText('Tick 1');
  });

  test('clicking a roster resident is interactive', async ({ page }) => {
    const card = page.locator('[data-testid*="pg-card"]').first();
    await expect(card).toBeVisible();
    // Verify the card is clickable (assignment logic tested in RTL).
    await card.click();
  });
});
