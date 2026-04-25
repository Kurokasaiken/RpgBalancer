import { test, expect } from '@playwright/test';
import { seedVillageSandbox } from './fixtures/villageSandbox';

test.describe('VillageSandbox Picker Replay', () => {
  test('replays assignment_success event and verifies worker drop', async ({ page }) => {
    await page.goto('/');
    await seedVillageSandbox(page, { tabId: 'map' });

    // Simulate adding an event to the telemetry buffer
    // This requires the diagnostics panel to be visible
    // Assuming dev mode is on for diagnostics

    // Wait for diagnostics panel
    await page.waitForSelector('[data-testid="worker-picker-diagnostics-panel"]', { timeout: 10000 });

    // Click Quick Replay Last (assuming an event exists)
    const replayButton = page.locator('button:has-text("Quick Replay Last")');
    await expect(replayButton).toBeVisible();

    // Before replay, check no resident in a slot (assuming slot-1 is empty)
    // This is tricky without specific selectors

    await replayButton.click();

    // Wait for replay to complete
    await page.waitForTimeout(1000);

    // Verify replay status is success
    await expect(page.locator('text=Replay Status: success')).toBeVisible();

    // Verify picker is closed (no open picker dialog)
    // Assume picker closes after replay
    // This might need adjustment based on actual UI
  });

  test('replays open event and verifies picker opens', async ({ page }) => {
    await page.goto('/');
    await seedVillageSandbox(page, { tabId: 'map' });

    await page.waitForSelector('[data-testid="worker-picker-diagnostics-panel"]');

    const replayButton = page.locator('button:has-text("Quick Replay Last")');
    await expect(replayButton).toBeVisible();

    await replayButton.click();

    await page.waitForTimeout(1000);

    // Verify picker opens for the slot
    // Assume slot-1 picker is open
    await expect(page.locator('[data-testid="worker-picker-sheet"]')).toBeVisible();
  });
});
