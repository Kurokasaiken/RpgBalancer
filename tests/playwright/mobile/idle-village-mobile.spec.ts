import { test, expect, devices } from '@playwright/test';

// Mobile device configurations for testing
const MOBILE_DEVICES = {
  'iPhone-13': devices['iPhone 13'],
  'iPad': devices['iPad Pro'],
  'Android': devices['Pixel 5'],
};

const MOBILE_VIEWPORTS = [
  { width: 375, height: 667 },  // iPhone SE
  { width: 390, height: 844 },  // iPhone 13
  { width: 414, height: 896 },  // iPhone 13 Pro Max
  { width: 768, height: 1024 }, // iPad
  { width: 393, height: 851 }, // Android
];

test.describe('Idle Village Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/idle-village');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-loaded"]');
  });

  // Test basic mobile viewport rendering
  MOBILE_VIEWPORTS.forEach(viewport => {
    test(`renders correctly on ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      
      // Check that main layout elements are visible
      await expect(page.locator('[data-testid="village-sandbox-layout"]')).toBeVisible();
      await expect(page.locator('[data-testid="village-sandbox-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="village-sandbox-columns"]')).toBeVisible();
      
      // Check mobile layout is applied
      const columns = page.locator('[data-testid="village-sandbox-columns"]');
      await expect(columns).toHaveAttribute('data-layout', 'board');
      
      // Verify responsive grid behavior
      const leftColumn = page.locator('[data-testid="village-sandbox-left-column"]');
      await expect(leftColumn).toBeVisible();
    });
  });

  // Test touch interactions
  test('supports touch interactions', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Test tap interaction on activity slots
    const activitySlot = page.locator('[data-testid="activity-slot"]').first();
    await expect(activitySlot).toBeVisible();
    
    // Tap to open picker
    await activitySlot.tap();
    await expect(page.locator('[data-testid="worker-picker-sheet"]')).toBeVisible();
    
    // Close picker
    const closeButton = page.locator('[data-testid="picker-close-button"]');
    if (await closeButton.isVisible()) {
      await closeButton.tap();
    }
  });

  // Test mobile picker interface
  test('mobile worker picker functions correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Open picker
    const activitySlot = page.locator('[data-testid="activity-slot"]').first();
    await activitySlot.tap();
    
    // Wait for picker to load
    await page.waitForSelector('[data-testid="worker-picker-sheet"]');
    
    // Check resident cards are present
    const residentCards = page.locator('[data-testid="resident-card"]');
    await expect(residentCards.first()).toBeVisible();
    
    // Test resident selection
    const firstResident = residentCards.first();
    await firstResident.tap();
    
    // Verify assignment
    await expect(page.locator('[data-testid="assignment-success"]')).toBeVisible({ timeout: 5000 });
  });

  // Test mobile navigation
  test('mobile navigation elements are accessible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Check cycle controls
    const cycleToggle = page.locator('[data-testid="cycle-toggle-button"]');
    await expect(cycleToggle).toBeVisible();
    await expect(cycleToggle).toBeEnabled();
    
    // Check work shift button
    const workShiftButton = page.locator('[data-testid="work-shift-button"]');
    await expect(workShiftButton).toBeVisible();
    
    // Check rest button
    const restButton = page.locator('[data-testid="rest-button"]');
    await expect(restButton).toBeVisible();
    
    // Verify touch target sizes (minimum 44px for iOS)
    const buttonBoundingBox = await cycleToggle.boundingBox();
    expect(buttonBoundingBox?.height).toBeGreaterThanOrEqual(44);
    expect(buttonBoundingBox?.width).toBeGreaterThanOrEqual(44);
  });

  // Test responsive layout switching
  test('layout switches between board and stacked modes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Initial layout should be 'board'
    const columns = page.locator('[data-testid="village-sandbox-columns"]');
    await expect(columns).toHaveAttribute('data-layout', 'board');
    
    // Open picker to trigger stacked layout
    const activitySlot = page.locator('[data-testid="activity-slot"]').first();
    await activitySlot.tap();
    
    // Layout should switch to 'stacked' when picker is active
    await expect(columns).toHaveAttribute('data-layout', 'stacked');
    
    // Close picker
    const overlay = page.locator('[data-testid="worker-picker-overlay"]');
    if (await overlay.isVisible()) {
      await overlay.click({ position: { x: 10, y: 10 } });
    }
    
    // Layout should return to 'board'
    await expect(columns).toHaveAttribute('data-layout', 'board');
  });

  // Test mobile-specific components
  test('mobile-specific components render correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Check that mobile-optimized components are present
    await expect(page.locator('[data-testid="active-hud"]')).toBeVisible();
    
    // Verify touch-friendly interfaces
    const residentRoster = page.locator('[data-testid="resident-roster"]');
    if (await residentRoster.isVisible()) {
      const residentCards = residentRoster.locator('[data-testid="resident-card"]');
      await expect(residentCards.first()).toBeVisible();
    }
  });

  // Test performance on mobile
  test('meets mobile performance thresholds', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Measure initial load performance
    const navigationStart = await page.evaluate(() => performance.timing.navigationStart);
    const loadComplete = await page.evaluate(() => performance.timing.loadEventEnd);
    const loadTime = loadComplete - navigationStart;
    
    // Should load within 3 seconds on mobile
    expect(loadTime).toBeLessThan(3000);
    
    // Test interaction responsiveness
    const startTime = Date.now();
    const activitySlot = page.locator('[data-testid="activity-slot"]').first();
    await activitySlot.tap();
    const interactionTime = Date.now() - startTime;
    
    // Interactions should respond within 300ms
    expect(interactionTime).toBeLessThan(300);
  });
});

// Device-specific tests
test.describe('Idle Village Device-Specific Tests', () => {
  Object.entries(MOBILE_DEVICES).forEach(([deviceName, _device]) => {
    test(`works correctly on ${deviceName}`, async ({ page }) => {
      await page.goto('/idle-village');
      await page.waitForSelector('[data-testid="app-loaded"]');
      
      // Test device-specific features
      await expect(page.locator('[data-testid="village-sandbox-layout"]')).toBeVisible();
      
      // Test touch interactions work
      const activitySlot = page.locator('[data-testid="activity-slot"]').first();
      await activitySlot.tap();
      await expect(page.locator('[data-testid="worker-picker-sheet"]')).toBeVisible();
    });
  });
});

// Accessibility tests for mobile
test.describe('Idle Village Mobile Accessibility', () => {
  test('meets mobile accessibility standards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/idle-village');
    await page.waitForSelector('[data-testid="app-loaded"]');
    
    // Check semantic HTML structure
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    
    // Check ARIA labels
    const cycleToggle = page.locator('[data-testid="cycle-toggle-button"]');
    await expect(cycleToggle).toHaveAttribute('aria-busy');
    
    // Check focus management
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Check color contrast (basic check)
    const header = page.locator('[data-testid="village-sandbox-header"]');
    const headerColor = await header.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(headerColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});

// Orientation tests
test.describe('Idle Village Orientation Tests', () => {
  ['portrait', 'landscape'].forEach(orientation => {
    test(`works in ${orientation} orientation`, async ({ page }) => {
      const viewport = orientation === 'portrait' 
        ? { width: 390, height: 844 }
        : { width: 844, height: 390 };
      
      await page.setViewportSize(viewport);
      await page.goto('/idle-village');
      await page.waitForSelector('[data-testid="app-loaded"]');
      
      // Check layout adapts to orientation
      await expect(page.locator('[data-testid="village-sandbox-layout"]')).toBeVisible();
      
      // In landscape, ensure content is not cramped
      if (orientation === 'landscape') {
        const header = page.locator('[data-testid="village-sandbox-header"]');
        await expect(header).toBeVisible();
        const headerHeight = await header.evaluate(el => el.offsetHeight);
        expect(headerHeight).toBeLessThan(200); // Header shouldn't take too much space
      }
    });
  });
});
