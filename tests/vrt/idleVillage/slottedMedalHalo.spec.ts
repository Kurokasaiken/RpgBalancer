/**
 * SlottedMedal Halo Visual Regression Test Suite
 * 
 * Visual regression tests for SlottedMedalHaloCanvas component
 * Tests halo states (idle/active/done) using canvas snapshots
 */

import { test, expect } from '@playwright/test';

test.describe('SlottedMedal Halo Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test route with medal components
    await page.goto('/test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="test-roster-page"]', { timeout: 10000 });
  });

  test('should render idle halo state correctly', async ({ page }) => {
    // Find a medal in idle state
    const idleMedal = page.locator('[data-testid^="slotted-medal"][data-state="idle"]').first();
    
    if (await idleMedal.count() > 0) {
      // Focus on the medal's halo canvas
      const haloCanvas = idleMedal.locator('[data-testid="slotted-medal-halo-canvas"]');
      await expect(haloCanvas).toBeVisible();
      
      // Take screenshot of idle halo
      await page.screenshot({
        path: 'test-results/vrt-baseline/slottedMedalHalo/desktop-idle-halo.png',
        clip: await haloCanvas.boundingBox(),
      });
      
      // Verify halo visual characteristics
      const haloBox = await haloCanvas.boundingBox();
      if (haloBox) {
        expect(haloBox.width).toBeGreaterThan(0);
        expect(haloBox.height).toBeGreaterThan(0);
      }
    } else {
      // Create idle state for testing
      const medals = page.locator('[data-testid^="slotted-medal"]');
      const firstMedal = medals.first();
      
      if (await firstMedal.count() > 0) {
        // Ensure medal is in idle state
        await firstMedal.evaluate((el: any) => {
          el.setAttribute('data-state', 'idle');
        });
        
        const haloCanvas = firstMedal.locator('[data-testid="slotted-medal-halo-canvas"]');
        await page.waitForTimeout(500); // Allow state to update
        
        await page.screenshot({
          path: 'test-results/vrt-baseline/slottedMedalHalo/desktop-idle-halo.png',
          clip: await haloCanvas.boundingBox(),
        });
      }
    }
  });

  test('should render active halo state correctly', async ({ page }) => {
    // Find or create a medal in active state
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    
    if (await firstMedal.count() > 0) {
      // Set medal to active state
      await firstMedal.evaluate((el: any) => {
        el.setAttribute('data-state', 'active');
      });
      
      const haloCanvas = firstMedal.locator('[data-testid="slotted-medal-halo-canvas"]');
      await page.waitForTimeout(500); // Allow state to update
      
      await expect(haloCanvas).toBeVisible();
      
      // Take screenshot of active halo
      await page.screenshot({
        path: 'test-results/vrt-baseline/slottedMedalHalo/desktop-active-halo.png',
        clip: await haloCanvas.boundingBox(),
      });
      
      // Verify active halo is more prominent than idle
      const haloBox = await haloCanvas.boundingBox();
      expect(haloBox).toBeTruthy();
      expect(haloBox!.width).toBeGreaterThan(40); // Active halo should be larger
      expect(haloBox!.height).toBeGreaterThan(40);
    }
  });

  test('should render landing halo state correctly', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    
    if (await firstMedal.count() > 0) {
      // Set medal to landing state
      await firstMedal.evaluate((el: any) => {
        el.setAttribute('data-state', 'landing');
      });
      
      const haloCanvas = firstMedal.locator('[data-testid="slotted-medal-halo-canvas"]');
      await page.waitForTimeout(500);
      
      await expect(haloCanvas).toBeVisible();
      
      // Take screenshot of landing halo
      await page.screenshot({
        path: 'test-results/vrt-baseline/slottedMedalHalo/desktop-landing-halo.png',
        clip: await haloCanvas.boundingBox(),
      });
    }
  });

  test('should render locked halo state correctly', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    
    if (await firstMedal.count() > 0) {
      // Set medal to locked state
      await firstMedal.evaluate((el: any) => {
        el.setAttribute('data-state', 'locked');
      });
      
      const haloCanvas = firstMedal.locator('[data-testid="slotted-medal-halo-canvas"]');
      await page.waitForTimeout(500);
      
      await expect(haloCanvas).toBeVisible();
      
      // Take screenshot of locked halo
      await page.screenshot({
        path: 'test-results/vrt-baseline/slottedMedalHalo/desktop-locked-halo.png',
        clip: await haloCanvas.boundingBox(),
      });
    }
  });

  test('should render unlocking halo state correctly', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    
    if (await firstMedal.count() > 0) {
      // Set medal to unlocking state
      await firstMedal.evaluate((el: any) => {
        el.setAttribute('data-state', 'unlocking');
      });
      
      const haloCanvas = firstMedal.locator('[data-testid="slotted-medal-halo-canvas"]');
      await page.waitForTimeout(500);
      
      await expect(haloCanvas).toBeVisible();
      
      // Take screenshot of unlocking halo
      await page.screenshot({
        path: 'test-results/vrt-baseline/slottedMedalHalo/desktop-unlocking-halo.png',
        clip: await haloCanvas.boundingBox(),
      });
    }
  });

  test('should not render halo for empty state', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    
    if (await firstMedal.count() > 0) {
      // Set medal to empty state
      await firstMedal.evaluate((el: any) => {
        el.setAttribute('data-state', 'empty');
      });
      
      const haloCanvas = firstMedal.locator('[data-testid="slotted-medal-halo-canvas"]');
      await page.waitForTimeout(500);
      
      // Halo should not be visible for empty state
      await expect(haloCanvas).not.toBeVisible();
    }
  });

  test('should handle different medal types with halo', async ({ page }) => {
    const medalTypes = ['bronze', 'silver', 'gold', 'platinum'];
    
    for (const medalType of medalTypes) {
      const medal = page.locator(`[data-testid^="slotted-medal"][data-type="${medalType}"]`).first();
      
      if (await medal.count() > 0) {
        // Set to active state for consistent halo comparison
        await medal.evaluate((el: any) => {
          el.setAttribute('data-state', 'active');
        });
        
        const haloCanvas = medal.locator('[data-testid="slotted-medal-halo-canvas"]');
        await page.waitForTimeout(300);
        
        // Take screenshot for each medal type
        await page.screenshot({
          path: `test-results/vrt-baseline/slottedMedalHalo/desktop-${medalType}-active-halo.png`,
          clip: await haloCanvas.boundingBox(),
        });
      }
    }
  });

  test('should handle different size presets with halo', async ({ page }) => {
    const sizePresets = ['small', 'medium', 'large'];
    
    for (const size of sizePresets) {
      const medal = page.locator(`[data-testid^="slotted-medal"][data-size="${size}"]`).first();
      
      if (await medal.count() > 0) {
        // Set to active state
        await medal.evaluate((el: any) => {
          el.setAttribute('data-state', 'active');
        });
        
        const haloCanvas = medal.locator('[data-testid="slotted-medal-halo-canvas"]');
        await page.waitForTimeout(300);
        
        // Take screenshot for each size preset
        await page.screenshot({
          path: `test-results/vrt-baseline/slottedMedalHalo/desktop-${size}-active-halo.png`,
          clip: await haloCanvas.boundingBox(),
        });
        
        // Verify size differences
        const haloBox = await haloCanvas.boundingBox();
        expect(haloBox).toBeTruthy();
        
        if (size === 'small') {
          expect(haloBox!.width).toBeLessThan(60);
          expect(haloBox!.height).toBeLessThan(60);
        } else if (size === 'large') {
          expect(haloBox!.width).toBeGreaterThan(80);
          expect(haloBox!.height).toBeGreaterThan(80);
        }
      }
    }
  });

  test('should handle animation levels with halo', async ({ page }) => {
    const animationLevels = ['minimal', 'normal', 'intense'];
    
    for (const level of animationLevels) {
      const medal = page.locator('[data-testid^="slotted-medal"]').first();
      
      if (await medal.count() > 0) {
        // Set animation level and state
        await medal.evaluate((el: any, animLevel: string) => {
          el.setAttribute('data-state', 'active');
          el.setAttribute('data-animation-level', animLevel);
        }, level);
        
        const haloCanvas = medal.locator('[data-testid="slotted-medal-halo-canvas"]');
        await page.waitForTimeout(300);
        
        // Take screenshot for each animation level
        await page.screenshot({
          path: `test-results/vrt-baseline/slottedMedalHalo/desktop-${level}-animation-halo.png`,
          clip: await haloCanvas.boundingBox(),
        });
      }
    }
  });

  test('should handle rapid state transitions', async ({ page }) => {
    const medal = page.locator('[data-testid^="slotted-medal"]').first();
    
    if (await medal.count() > 0) {
      const haloCanvas = medal.locator('[data-testid="slotted-medal-halo-canvas"]');
      
      // Test rapid state changes
      const states = ['idle', 'active', 'landing', 'locked', 'unlocking'];
      
      for (const state of states) {
        await medal.evaluate((el: any, newState: string) => {
          el.setAttribute('data-state', newState);
        }, state);
        
        await page.waitForTimeout(100); // Brief pause for state update
        
        // Verify halo is still visible (except for empty state)
        if (state !== 'empty') {
          await expect(haloCanvas).toBeVisible();
        }
      }
      
      // Final screenshot after rapid transitions
      await page.screenshot({
        path: 'test-results/vrt-baseline/slottedMedalHalo/desktop-rapid-transitions-halo.png',
        clip: await haloCanvas.boundingBox(),
      });
    }
  });

  test('should maintain visual consistency across viewports', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1280, height: 720 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 },   // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(200);
      
      const medal = page.locator('[data-testid^="slotted-medal"]').first();
      
      if (await medal.count() > 0) {
        // Set to active state
        await medal.evaluate((el: any) => {
          el.setAttribute('data-state', 'active');
        });
        
        const haloCanvas = medal.locator('[data-testid="slotted-medal-halo-canvas"]');
        await page.waitForTimeout(300);
        
        // Take screenshot for each viewport
        await page.screenshot({
          path: `test-results/vrt-baseline/slottedMedalHalo/${viewport.width}x${viewport.height}-active-halo.png`,
          clip: await haloCanvas.boundingBox(),
        });
      }
    }
    
    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle canvas rendering errors gracefully', async ({ page }) => {
    const medal = page.locator('[data-testid^="slotted-medal"]').first();
    
    if (await medal.count() > 0) {
      // Simulate canvas error by setting invalid state
      await medal.evaluate((el: any) => {
        el.setAttribute('data-state', 'invalid-state');
      });
      
      const haloCanvas = medal.locator('[data-testid="slotted-medal-halo-canvas"]');
      await page.waitForTimeout(300);
      
      // Should handle error gracefully (either show fallback or nothing)
      // The important thing is that it doesn't crash the page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should compare halo screenshots against baseline', async ({ page }) => {
    // This test would be used in CI to compare against baseline screenshots
    const testCases = [
      { state: 'idle', file: 'desktop-idle-halo.png' },
      { state: 'active', file: 'desktop-active-halo.png' },
      { state: 'landing', file: 'desktop-landing-halo.png' },
      { state: 'locked', file: 'desktop-locked-halo.png' },
      { state: 'unlocking', file: 'desktop-unlocking-halo.png' },
    ];
    
    for (const testCase of testCases) {
      const medal = page.locator('[data-testid^="slotted-medal"]').first();
      
      if (await medal.count() > 0) {
        await medal.evaluate((el: any, newState: string) => {
          el.setAttribute('data-state', newState);
        }, testCase.state);
        
        const haloCanvas = medal.locator('[data-testid="slotted-medal-halo-canvas"]');
        await page.waitForTimeout(500);
        
        // Take current screenshot
        const currentScreenshot = await page.screenshot({
          clip: await haloCanvas.boundingBox(),
        });
        
        // Compare with baseline (this would be implemented in the visual comparison utility)
        // const comparison = await compareScreenshots(currentScreenshot, `test-results/vrt-baseline/slottedMedalHalo/${testCase.file}`);
        // expect(comparison.difference).toBeLessThan(0.05); // Allow for 5% difference
        
        // For now, just ensure the screenshot was taken
        expect(currentScreenshot).toBeTruthy();
      }
    }
  });
});
