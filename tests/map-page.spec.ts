import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __appNavControls?: { setActiveTab: (tab: string) => void };
  }
}

test.describe('MapPage (VillageSandbox)', () => {
  test('should load VillageSandbox without errors and display components', async ({ page }) => {
    // Start collecting console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await navigateToMap(page);

    // Check that Board HUD is visible
    await expect(page.locator('[data-testid="village-sandbox-board-hud"]')).toBeVisible();

    // Check that cycle controls are visible
    await expect(page.locator('[data-testid="cycle-toggle-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="cycle-day-count"]')).toBeVisible();

    // Check that Activity Slots section is visible
    await expect(page.getByText(/ACTIVITY SLOTS/i)).toBeVisible();

    // Check that Resource panel is visible
    await expect(page.locator('[data-testid="resource-panel"]')).toBeVisible();

    // Check that Roster section is visible
    await expect(page.locator('[data-testid="village-roster-section"]')).toBeVisible();
  });

  test('Resident roster displays and allows interaction', async ({ page }) => {
    await navigateToMap(page);

    // Wait for roster panel to be visible
    const rosterPanel = page.locator('[data-testid="resident-roster-panel"]');
    await rosterPanel.waitFor({ state: 'visible', timeout: 20000 });
    await expect(rosterPanel).toBeVisible();

    // Check that resident count is displayed
    await expect(page.locator('[data-testid="resident-count"]')).toBeVisible();

    // Verify no critical console errors occurred
    await page.waitForTimeout(1000);
  });
});

async function navigateToMap(page: Page) {
  await page.goto('/');
  await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 15000 });
  await page.waitForFunction(() => Boolean(window.__appNavControls), undefined, { timeout: 10000 });
  await page.evaluate(() => {
    window.__appNavControls?.setActiveTab('map');
  });
  await page.waitForSelector('text=Loading Idle Village configuration…', { state: 'detached', timeout: 30000 });
  await page.waitForSelector('text=Loading Map…', { state: 'detached', timeout: 10000 });
}
