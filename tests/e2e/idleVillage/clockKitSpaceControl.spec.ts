import { test, expect } from '@playwright/test';

test.describe('clockKit — global Space play/pause on /minimal-clock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/minimal-clock');
    await expect(page.getByTestId('minimal-clock-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('time-engine-strip-compact')).toBeVisible({ timeout: 30_000 });
  });

  test('toggles play and pause with the Space key anywhere on the page', async ({ page }) => {
    const playButton = page.getByLabel('Play');
    const pauseButton = page.getByLabel('Pausa');

    // Initial state is paused
    await expect(playButton).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Space');
    await expect(pauseButton).toBeVisible({ timeout: 5_000 });
    await expect(playButton).not.toBeVisible();

    await page.keyboard.press('Space');
    await expect(playButton).toBeVisible({ timeout: 5_000 });
    await expect(pauseButton).not.toBeVisible();
  });
});
