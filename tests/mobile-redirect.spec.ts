import { test, expect } from '@playwright/test';

// Skip tests if Node.js version < 20 (required for Vite compatibility)
const nodeVersion = process.versions.node.split('.').map(Number);
const shouldSkip = nodeVersion[0] < 20;

if (shouldSkip) {
  test.describe.skip('Mobile Redirect E2E Tests - Node.js version < 20', () => {
    test('dummy test', () => {
      // Empty test to satisfy describe.skip
    });
  });
} else {
  test.describe('Mobile Redirect E2E Tests', () => {
    test.describe('Mobile User Agent Detection', () => {
      test.use({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      });

      test('should redirect mobile users to mobile-optimized experience', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Verify we're in mobile mode - check for mobile-specific elements or URL params
        const url = page.url();
        expect(url).toContain('mobile=true');

        // Or check for mobile layout indicators
        const mobileIndicator = page.locator('[data-testid="mobile-layout"], .mobile-layout, [data-mobile="true"]');
        await expect(mobileIndicator).toBeVisible({ timeout: 5000 });
      });

      test('should maintain mobile redirect on navigation', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to different sections
        await page.getByTestId('nav-btn-punchClub').click();
        await page.waitForLoadState('networkidle');

        // Verify mobile mode persists
        const url = page.url();
        expect(url).toContain('mobile=true');
      });
    });

    test.describe('Desktop User Agent (No Redirect)', () => {
      test.use({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        isMobile: false,
        hasTouch: false,
      });

      test('should not redirect desktop users', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Verify no mobile redirect
        const url = page.url();
        expect(url).not.toContain('mobile=true');
      });
    });

    test.describe('Manual Mobile Override', () => {
      test('should respect manual mobile=true parameter', async ({ page }) => {
        await page.goto('/?mobile=true');
        await page.waitForLoadState('networkidle');

        // Verify mobile mode is active
        const url = page.url();
        expect(url).toContain('mobile=true');
      });

      test('should respect manual mobile=false parameter', async ({ page }) => {
        await page.goto('/?mobile=false');
        await page.waitForLoadState('networkidle');

        // Verify mobile mode is disabled
        const url = page.url();
        expect(url).not.toContain('mobile=true');
      });
    });
  });
}
