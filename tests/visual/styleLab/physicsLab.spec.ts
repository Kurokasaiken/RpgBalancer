/**
 * Physics Lab Visual Regression Tests
 *
 * Playwright visual tests for Physics Lab components with Style Lab integration.
 * Tests visual consistency across presets, layouts, and accessibility modes.
 */

import { test, expect } from '@playwright/test';
import { dragElement } from '../../utils/dragActions';

test.describe('Physics Lab Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Physics Lab stories
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--default&viewMode=story');
    await page.waitForLoadState('networkidle');
  });

  test('should render Physics Lab with default preset', async ({ page }) => {
    // Wait for component to load
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // Take baseline screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-default.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render Physics Lab with Obsidian Vault preset', async ({ page }) => {
    // Navigate to Obsidian Vault story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--obsidian-vault&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // Take screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-obsidian.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render Physics Lab with Blizzard Rift preset', async ({ page }) => {
    // Navigate to Blizzard Rift story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--blizzard-rift&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // Take screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-blizzard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render Lab Panel controls correctly', async ({ page }) => {
    // Navigate to Lab Panel story
    await page.goto('/iframe.html?id=physics-lab-sidebarcontrols--default&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="lab-panel"]', { timeout: 5000 });
    
    // Take screenshot of controls
    await expect(page.locator('body')).toHaveScreenshot('lab-panel-default.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should show tab navigation correctly', async ({ page }) => {
    // Navigate to Lab Panel story
    await page.goto('/iframe.html?id=physics-lab-sidebarcontrols--default&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="lab-panel"]', { timeout: 5000 });
    
    // Check tab navigation is visible
    const tabNavigation = page.locator('.tab-navigation');
    await expect(tabNavigation).toBeVisible();
    
    // Check all tabs are present
    const tabs = page.locator('.tab-button');
    await expect(tabs).toHaveCount(4); // Physics, Materials, FX, Outcomes
    
    // Take screenshot of tab navigation
    await expect(tabNavigation).toHaveScreenshot('lab-panel-tabs.png');
  });

  test('should handle drag and drop interactions', async ({ page }) => {
    // Navigate to default story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--default&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // Find draggable card and droppable slot
    const card = page.locator('[data-testid="tactile-card"]').first();
    const slot = page.locator('[data-testid="sunken-slot"]').first();
    
    // Ensure elements are present
    await expect(card).toBeVisible();
    await expect(slot).toBeVisible();
    
    // Perform drag operation
    await dragElement(page, card, slot, {
      steps: 12,
      onIntermediateMove: async ({ page }) => {
        // Check for visual feedback during drag
        await expect(page.locator('[data-testid="physics-lab-app"]')).toBeVisible();
      },
    });
    
    // Take screenshot after drag
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-after-drag.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render high contrast mode correctly', async ({ page }) => {
    // Navigate to high contrast story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--high-contrast&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // Take screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-high-contrast.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render reduced motion mode correctly', async ({ page }) => {
    // Navigate to reduced motion story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--reduced-motion&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // Take screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-reduced-motion.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render preset comparison grid correctly', async ({ page }) => {
    // Navigate to preset comparison story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--preset-comparison&viewMode=story');
    await page.waitForLoadState('networkidle');
    
    // Wait for grid to load
    await page.waitForSelector('div[style*="grid-template-columns"]', { timeout: 5000 });
    
    // Take screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-preset-comparison.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render Lab Panel compact layout correctly', async ({ page }) => {
    // Navigate to compact layout story
    await page.goto('/iframe.html?id=physics-lab-sidebarcontrols--compact-layout&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="lab-panel"]', { timeout: 5000 });
    
    // Take screenshot
    await expect(page.locator('body')).toHaveScreenshot('lab-panel-compact.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render Lab Panel FX tab correctly', async ({ page }) => {
    // Navigate to FX tab story
    await page.goto('/iframe.html?id=physics-lab-sidebarcontrols--fx-tab&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="lab-panel"]', { timeout: 5000 });
    
    // Take screenshot
    await expect(page.locator('body')).toHaveScreenshot('lab-panel-fx-tab.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render Lab Panel Outcomes tab correctly', async ({ page }) => {
    // Navigate to Outcomes tab story
    await page.goto('/iframe.html?id=physics-lab-sidebarcontrols--outcomes-tab&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="lab-panel"]', { timeout: 5000 });
    
    // Take screenshot
    await expect(page.locator('body')).toHaveScreenshot('lab-panel-outcomes-tab.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Physics Lab Responsive Tests', () => {
  test('should render correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to default story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--default&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // Take mobile screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Navigate to default story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--default&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // Take tablet screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Physics Lab Performance Tests', () => {
  test('should load within performance budget', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now();
    
    // Navigate to default story
    await page.goto('/iframe.html?id=physics-lab-physicslabapp--default&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="physics-lab-app"]', { timeout: 5000 });
    
    // End performance measurement
    const loadTime = Date.now() - startTime;
    
    // Assert load time is within budget (3 seconds)
    expect(loadTime).toBeLessThan(3000);
    
    // Take performance screenshot
    await expect(page.locator('body')).toHaveScreenshot('physics-lab-performance.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
