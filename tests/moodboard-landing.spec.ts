import { test, expect } from '@playwright/test';
import { openNavTab } from './helpers/navigation';

// Skip tests if Node.js version < 20 (required for Vite compatibility)
const nodeVersion = process.versions.node.split('.').map(Number);
const shouldSkip = nodeVersion[0] < 20;

if (shouldSkip) {
  test.describe.skip('Moodboard Landing Page E2E Tests - Node.js version < 20', () => {
    test('dummy test', () => {
      // Empty test to satisfy describe.skip
    });
  });
} else {
  test.describe('Moodboard Landing Page E2E Tests', () => {
    test.describe('Desktop Viewport', () => {
      test.use({
        viewport: { width: 1920, height: 1080 },
        isMobile: false,
        hasTouch: false,
      });

      test('should load moodboard tab content on navigation', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to moodboard tab
        await openNavTab(page, 'moodboard');
        await page.waitForLoadState('networkidle');

        // Verify moodboard tab is active
        await page.waitForFunction(() => window.__appNavControls?.getActiveTab?.() === 'moodboard');

        // Verify moodboard content is loaded
        const moodboardContent = page.locator('[data-testid="moodboard-content"], [data-moodboard="true"]');
        await expect(moodboardContent).toBeVisible({ timeout: 5000 });

        // Verify moodboard title or header
        const moodboardTitle = page.locator('.moodboard-title');
        await expect(moodboardTitle).toBeVisible();
      });

      test('should display moodboard images or visual elements', async ({ page }) => {
        await page.goto('/#moodboard');
        await page.waitForLoadState('networkidle');

        // Check for image elements in moodboard
        const moodboardImages = page.locator('[data-testid="moodboard-content"] img, .moodboard img');
        const imageCount = await moodboardImages.count();
        expect(imageCount).toBeGreaterThan(0);
      });

      test('should handle hash-based navigation to moodboard', async ({ page }) => {
        await page.goto('/#moodboard');
        await page.waitForLoadState('networkidle');

        // Verify moodboard tab is active
        await page.waitForFunction(() => window.__appNavControls?.getActiveTab?.() === 'moodboard');

        // Verify content is loaded
        const content = page.locator('[data-testid="moodboard-content"]');
        await expect(content).toBeVisible();
      });
    });

    test.describe('Mobile Viewport', () => {
      test.use({
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      });

      test('should load moodboard content on mobile navigation', async ({ page }) => {
        await page.goto('/?mobile=true');
        await page.waitForLoadState('networkidle');

        // Navigate to moodboard on mobile
        const moodboardNav = page.getByTestId('nav-btn-moodboard');
        if (await moodboardNav.isVisible()) {
          await moodboardNav.click();
        } else {
          // Mobile might use drawer navigation
          const menuButton = page.locator('[data-testid="mobile-menu-btn"], .menu-btn');
          if (await menuButton.isVisible()) {
            await menuButton.click();
            await page.getByTestId('nav-btn-moodboard').click();
          }
        }

        await page.waitForLoadState('networkidle');

        // Verify mobile moodboard content
        const mobileContent = page.locator('[data-testid="moodboard-content"], .moodboard-mobile');
        await expect(mobileContent).toBeVisible({ timeout: 5000 });
      });

      test('should maintain moodboard state on mobile orientation change', async ({ page }) => {
        await page.goto('/#moodboard?mobile=true');
        await page.waitForLoadState('networkidle');

        // Verify initial load
        const content = page.locator('[data-testid="moodboard-content"]');
        await expect(content).toBeVisible();

        // Simulate orientation change (viewport resize)
        await page.setViewportSize({ width: 667, height: 375 }); // Landscape
        await page.waitForTimeout(500);

        // Verify content still visible after orientation change
        await expect(content).toBeVisible();

        // Back to portrait
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);

        await expect(content).toBeVisible();
      });
    });

    test.describe('Content Loading Performance', () => {
      test('should load moodboard content within 3 seconds', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/#moodboard');
        await page.waitForLoadState('networkidle');

        const content = page.locator('[data-testid="moodboard-content"]');
        await expect(content).toBeVisible({ timeout: 3000 });

        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(3000);
        console.log(`Moodboard loaded in ${loadTime}ms`);
      });

      test('should lazy load moodboard images progressively', async ({ page }) => {
        await page.goto('/#moodboard');
        await page.waitForLoadState('networkidle');

        // Check for lazy loading attributes
        const lazyImages = page.locator('img[loading="lazy"], img[data-src]');
        const lazyCount = await lazyImages.count();

        if (lazyCount > 0) {
          console.log(`Found ${lazyCount} lazy-loaded images`);
        }

        // Verify at least some images are loaded
        const loadedImages = page.locator('img[src]:not([src=""])');
        await expect(loadedImages.first()).toBeVisible({ timeout: 5000 });
      });
    });

    test.describe('Accessibility', () => {
      test('should have proper heading structure', async ({ page }) => {
        await page.goto('/#moodboard');
        await page.waitForLoadState('networkidle');

        // Check for main heading
        const mainHeading = page.locator('h1').first();
        await expect(mainHeading).toBeVisible();

        // Check heading hierarchy
        const headings = page.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();
        expect(headingCount).toBeGreaterThan(0);
      });

      test('should have accessible navigation to moodboard', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check navigation button has proper accessibility
        const navButton = page.getByTestId('nav-btn-moodboard');
        await expect(navButton).toBeVisible();

        const ariaLabel = await navButton.getAttribute('aria-label');
        const buttonText = await navButton.textContent();

        expect(ariaLabel || buttonText).toBeTruthy();
      });
    });
  });
}
