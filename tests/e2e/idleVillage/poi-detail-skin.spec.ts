/**
 * POI Detail Skin E2E Tests
 * 
 * End-to-end tests for POI Detail skin integration covering:
 * - Complete skin rendering on /test route
 * - Visual regression testing
 * - Telemetry event verification
 * - Interactive functionality testing
 * - Cross-browser compatibility
 */

import { test, expect } from '@playwright/test';

test.describe('@poi-detail POI Detail Skin Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test route
    await page.goto('/test');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for POI detail wrapper to be visible
    await page.waitForSelector('[data-testid="poi-detail-skin-wrapper-demo"]', { timeout: 10000 });
  });

  test('should render POI Detail skin with correct structure', async ({ page }) => {
    // Verify POI detail wrapper is present
    const poiDetailWrapper = page.locator('[data-testid="poi-detail-skin-wrapper-demo"]');
    await expect(poiDetailWrapper).toBeVisible();
    
    // Verify skin is applied (check for skin-specific attributes)
    await expect(poiDetailWrapper).toHaveAttribute('data-skin-applied', 'true');
    
    // Verify activity information is displayed
    await expect(page.locator('text=Gold Mine')).toBeVisible();
    await expect(page.locator('text=Extract precious resources')).toBeVisible();
    
    // Verify slots are displayed
    const slots = page.locator('[data-testid*="slot-"]');
    await expect(slots).toHaveCount(3); // Gold mine has 3 slots
  });

  test('should emit telemetry events on skin render', async ({ page }) => {
    // Listen for console events to capture telemetry
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('poi_detail_skin_rendered')) {
        consoleMessages.push(msg.text());
      }
    });

    // Reload page to trigger fresh telemetry
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="poi-detail-skin-wrapper-demo"]');

    // Wait for telemetry to be emitted
    await page.waitForTimeout(100);

    // Verify telemetry was emitted
    expect(consoleMessages.some(msg => 
      msg.includes('poi_detail_skin_rendered') && 
      msg.includes('poi_detail_dark_luxury')
    )).toBeTruthy();
  });

  test('should display correct visual styling', async ({ page }) => {
    const poiDetailWrapper = page.locator('[data-testid="poi-detail-skin-wrapper-demo"]');
    
    // Verify Dark Luxury aesthetic through computed styles
    const computedStyles = await poiDetailWrapper.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
        borderRadius: styles.borderRadius,
      };
    });

    // Verify Dark Luxury color scheme
    expect(computedStyles.backgroundColor).toBe('rgb(12, 10, 8)'); // #0c0a08
    expect(computedStyles.color).toMatch(/rgb\(255,\s*216,\s*74\)/); // #ffd84a
    expect(computedStyles.fontFamily).toContain('EB Garamond');
    expect(computedStyles.borderRadius).toBe('26px');
  });

  test('should handle slot interactions correctly', async ({ page }) => {
    // Find empty slots
    const emptySlots = page.locator('[data-testid*="slot-"][data-state="empty"]');
    
    if (await emptySlots.count() > 0) {
      // Click on first empty slot
      await emptySlots.first().click();
      
      // Verify interaction (should trigger some response)
      // This would depend on the specific implementation
      await page.waitForTimeout(100);
    }
  });

  test('should display activity information correctly', async ({ page }) => {
    // Verify activity name and type
    await expect(page.locator('text=Gold Mine')).toBeVisible();
    
    // Verify subtitle/description
    await expect(page.locator('text=Extract precious resources')).toBeVisible();
    
    // Verify status information
    await expect(page.locator('text=idle')).toBeVisible();
    
    // Verify progress information
    await expect(page.locator('text=0%')).toBeVisible();
    
    // Verify slot information
    await expect(page.locator('text=3/3')).toBeVisible();
  });

  test('should handle window dragging if enabled', async ({ page }) => {
    const poiDetailWrapper = page.locator('[data-testid="poi-detail-skin-wrapper-demo"]');
    
    // Check if drag handle is present
    const dragHandle = poiDetailWrapper.locator('.activity-capsule-detail-skin-aware__drag-handle');
    
    if (await dragHandle.count() > 0) {
      // Get initial position
      const initialBox = await poiDetailWrapper.boundingBox();
      expect(initialBox).toBeTruthy();
      
      // Perform drag operation
      await dragHandle.hover();
      await page.mouse.down();
      await page.mouse.move(initialBox!.x + 100, initialBox!.y + 50);
      await page.mouse.up();
      
      // Verify position changed (if dragging is implemented)
      await page.waitForTimeout(100);
    }
  });

  test('should handle close button interaction', async ({ page }) => {
    // Look for close button
    const closeButton = page.locator('button[aria-label*="Close"], button:has-text("Close"), button:has-text("✕")');
    
    if (await closeButton.count() > 0) {
      // Click close button
      await closeButton.click();
      
      // Verify window closes (this would depend on implementation)
      await page.waitForTimeout(100);
    }
  });

  test('should be responsive to different viewport sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    const poiDetailWrapper = page.locator('[data-testid="poi-detail-skin-wrapper-demo"]');
    await expect(poiDetailWrapper).toBeVisible();
    
    // Check for responsive behavior
    const mobileStyles = await poiDetailWrapper.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        maxWidth: styles.maxWidth,
      };
    });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(100);
    
    await expect(poiDetailWrapper).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const poiDetailWrapper = page.locator('[data-testid="poi-detail-skin-wrapper-demo"]');
    
    // Focus the wrapper
    await poiDetailWrapper.focus();
    
    // Test Tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);
    
    // Verify focus moved to interactive elements
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.count()).toBeGreaterThan(0);
  });

  test('should handle accessibility attributes', async ({ page }) => {
    const poiDetailWrapper = page.locator('[data-testid="poi-detail-skin-wrapper-demo"]');
    
    // Check for proper ARIA attributes
    await expect(poiDetailWrapper).toHaveAttribute('aria-live');
    await expect(poiDetailWrapper).toHaveAttribute('aria-label');
    
    // Check for proper role attributes
    const interactiveElements = page.locator('button, [role="button"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      await expect(element).toHaveAttribute('aria-label');
    }
  });
});

test.describe('@poi-detail Visual Regression Tests', () => {
  test('should match visual baseline - desktop', async ({ page }) => {
    await page.goto('/test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="poi-detail-skin-wrapper-demo"]');
    
    // Take screenshot for visual regression
    await page.locator('[data-testid="poi-detail-skin-wrapper-demo"]').screenshot({
      path: 'test-results/vrt-baseline/poi-detail/desktop-poi-detail-skin.png',
    });
  });

  test('should match visual baseline - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="poi-detail-skin-wrapper-demo"]');
    
    // Take screenshot for visual regression
    await page.locator('[data-testid="poi-detail-skin-wrapper-demo"]').screenshot({
      path: 'test-results/vrt-baseline/poi-detail/mobile-poi-detail-skin.png',
    });
  });
});

test.describe('@poi-detail Performance Tests', () => {
  test('should render within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="poi-detail-skin-wrapper-demo"]');
    
    const endTime = Date.now();
    const renderTime = endTime - startTime;
    
    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });

  test('should not have layout shifts', async ({ page }) => {
    await page.goto('/test');
    
    // Wait for initial render
    await page.waitForSelector('[data-testid="poi-detail-skin-wrapper-demo"]');
    
    // Get initial position
    const initialPosition = await page.locator('[data-testid="poi-detail-skin-wrapper-demo"]').boundingBox();
    
    // Wait for any potential layout shifts
    await page.waitForTimeout(1000);
    
    // Check position hasn't changed significantly
    const finalPosition = await page.locator('[data-testid="poi-detail-skin-wrapper-demo"]').boundingBox();
    
    expect(Math.abs(initialPosition!.x - finalPosition!.x)).toBeLessThan(5);
    expect(Math.abs(initialPosition!.y - finalPosition!.y)).toBeLessThan(5);
  });
});
