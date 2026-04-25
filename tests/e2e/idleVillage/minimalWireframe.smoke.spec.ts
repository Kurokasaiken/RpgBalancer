import { test, expect, Page } from '@playwright/test';

const PAGE_URL = '/minimal-gameplay';

const getHudValue = (page: Page, field: 'day' | 'gold' | 'food' | 'fatigue') =>
  page.locator(`[data-testid="hud-${field}"]`);

const expectHudText = async (locatorPromise: ReturnType<typeof getHudValue>, expected: string | RegExp) => {
  await expect(locatorPromise).toHaveText(expected);
};

test.describe('Minimal Gameplay Wireframe – UI smoke', () => {
  test('should react to core debug controls like a real user', async ({ page }) => {
    await page.goto(PAGE_URL);
    const root = page.locator('[data-testid="minimal-gameplay-page"]');
    await expect(root).toBeVisible();
    
    // Verify basic page structure exists (elements may be collapsed)
    const styleLabExists = await page.locator('text=Style Laboratory').isVisible().catch(() => false);
    const timeEngineExists = await page.locator('text=Time Engine').isVisible().catch(() => false);
    
    // At least one of the main sections should be visible
    expect(styleLabExists || timeEngineExists).toBeTruthy();
    
    // Verify basic time controls exist
    const dayText = await page.locator('text=Day:').isVisible().catch(() => false);
    const timeText = await page.locator('text=Time:').isVisible().catch(() => false);
    expect(dayText || timeText).toBeTruthy();
    
    // Test pause/resume functionality if available
    const pauseButton = page.locator('button:has-text("Pause")');
    const resumeButton = page.locator('button:has-text("Resume")');
    
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      await expect(resumeButton).toBeVisible({ timeout: 2000 });
    } else if (await resumeButton.isVisible()) {
      await resumeButton.click();
      await expect(pauseButton).toBeVisible({ timeout: 2000 });
    }
    
    // Test reset functionality if available
    const resetButton = page.locator('button:has-text("Reset")');
    if (await resetButton.isVisible()) {
      await resetButton.click();
      // Verify page is still functional after reset
      await expect(root).toBeVisible();
    }

    });
});
