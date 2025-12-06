import { test, expect } from '@playwright/test';

// Mobile-specific checks for Spell Creator New UI
// Aligned with MOBILE_GUIDELINES and responsive_ui_plan

test.describe('Spell Creator New - Mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    // Force a mobile-like viewport even if project is desktop
    await page.setViewportSize({ width: 393, height: 852 }); // iPhone 14 Pro-ish
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('mobile layout: no horizontal overflow and primary actions are touch-friendly', async ({ page }) => {
    // Navigate to Spell Creator New using bottom nav "Spells"
    await page.getByRole('button', { name: 'Spells' }).click();

    // Sanity check: header visible
    await expect(page.getByText('Spell Creator')).toBeVisible();

    // Check no horizontal overflow on mobile
    const hasHorizontalOverflow = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      return scrollWidth > width + 1; // small epsilon
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    // Check primary action button (Save Spell / Balance Required) has reasonable touch size
    const primaryButton = page.getByRole('button', {
      name: /Save Spell|Balance Required/,
    }).first();

    const box = await primaryButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Minimum touch target (44x44)
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      // Avoid excessively tall buttons on mobile
      expect(box.height).toBeLessThanOrEqual(96);
    }
  });
});
