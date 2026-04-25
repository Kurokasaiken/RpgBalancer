import { test, expect } from '@playwright/test';

test.describe('Day/Night Cycle Space Pause', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/idle-village/minimal');
  });

  test('should render day/night action card', async ({ page }) => {
    const dayNightCard = page.getByTestId('day-night-card');
    await expect(dayNightCard).toBeVisible();
  });

  test('should show playing state initially', async ({ page }) => {
    const dayNightCard = page.getByTestId('day-night-card');
    await expect(dayNightCard).toBeVisible();
    
    // Should show phase icon (sun/moon) when playing
    const phaseIcon = dayNightCard.locator('[data-testid="phase-icon"]');
    await expect(phaseIcon).toBeVisible();
  });

  test('should pause when space key is pressed', async ({ page }) => {
    const dayNightCard = page.getByTestId('day-night-card');
    
    // Verify initial playing state
    await expect(dayNightCard).toBeVisible();
    
    // Press space key to pause
    await page.keyboard.press('Space');
    
    // Should show pause icon after pausing
    const pauseIcon = page.getByTestId('day-night-pause-icon');
    await expect(pauseIcon).toBeVisible();
  });

  test('should resume when space key is pressed again', async ({ page }) => {
    const dayNightCard = page.getByTestId('day-night-card');
    
    // Press space to pause
    await page.keyboard.press('Space');
    
    // Verify paused state
    const pauseIcon = page.getByTestId('day-night-pause-icon');
    await expect(pauseIcon).toBeVisible();
    
    // Press space again to resume
    await page.keyboard.press('Space');
    
    // Should show phase icon again when resumed
    const phaseIcon = dayNightCard.locator('[data-testid="phase-icon"]');
    await expect(phaseIcon).toBeVisible();
  });

  test('should not pause when typing in input fields', async ({ page }) => {
    // Look for any input fields (if they exist on the page)
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      // Focus on first input
      await inputs.first().focus();
      
      // Press space - should not pause the game
      await page.keyboard.press('Space');
      
      // Should still show playing state (phase icon)
      const dayNightCard = page.getByTestId('day-night-card');
      const phaseIcon = dayNightCard.locator('[data-testid="phase-icon"]');
      await expect(phaseIcon).toBeVisible();
      
      // Pause icon should not be visible
      const pauseIcon = page.getByTestId('day-night-pause-icon');
      await expect(pauseIcon).not.toBeVisible();
    } else {
      // If no inputs exist, test that space works normally
      await page.keyboard.press('Space');
      const pauseIcon = page.getByTestId('day-night-pause-icon');
      await expect(pauseIcon).toBeVisible();
    }
  });

  test('should toggle pause state multiple times', async ({ page }) => {
    const dayNightCard = page.getByTestId('day-night-card');
    
    // Toggle pause multiple times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      
      if (i % 2 === 0) {
        // Even presses (0, 2, 4) should pause
        const pauseIcon = page.getByTestId('day-night-pause-icon');
        await expect(pauseIcon).toBeVisible();
      } else {
        // Odd presses (1, 3) should resume
        const phaseIcon = dayNightCard.locator('[data-testid="phase-icon"]');
        await expect(phaseIcon).toBeVisible();
      }
    }
  });

  test('should have proper accessibility labels', async ({ page }) => {
    const dayNightCard = page.getByTestId('day-night-card');
    await expect(dayNightCard).toHaveAttribute('aria-label', 'Day/Night Cycle');
    await expect(dayNightCard).toHaveAttribute('role', 'button');
  });

  test('should respond to click on day/night card', async ({ page }) => {
    const dayNightCard = page.getByTestId('day-night-card');
    
    // Click the card to toggle pause
    await dayNightCard.click();
    
    // Should show pause icon
    const pauseIcon = page.getByTestId('day-night-pause-icon');
    await expect(pauseIcon).toBeVisible();
    
    // Click again to resume
    await dayNightCard.click();
    
    // Should show phase icon again
    const phaseIcon = dayNightCard.locator('[data-testid="phase-icon"]');
    await expect(phaseIcon).toBeVisible();
  });

  test('should show countdown timer', async ({ page }) => {
    const dayNightCard = page.getByTestId('day-night-card');
    
    // Look for countdown display (format MM:SS)
    const countdown = dayNightCard.locator('text=/\\d{2}:\\d{2}/');
    await expect(countdown).toBeVisible();
  });

  test('should prevent default space behavior', async ({ page }) => {
    // Focus on the page body
    await page.locator('body').focus();
    
    // Press space - should not scroll the page
    const initialScrollY = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('Space');
    const finalScrollY = await page.evaluate(() => window.scrollY);
    
    // Scroll position should not change
    expect(finalScrollY).toBe(initialScrollY);
    
    // But pause state should toggle
    const pauseIcon = page.getByTestId('day-night-pause-icon');
    await expect(pauseIcon).toBeVisible();
  });
});
