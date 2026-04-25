/**
 * ActionHalo Skin Component E2E Tests
 * 
 * Playwright tests for ActionHalo component with drag simulation,
 * visual regression, and pillar variant verification.
 * 
 * Coverage: visual regression, drag/drop, pillar variants, interactions
 */

import { test, expect } from '@playwright/test';
import { dragElement } from '@/tests/helpers/dragHelpers';

test.describe('ActionHalo Skin E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
  });

  test.describe('Visual Regression', () => {
    test('ActionHalo baseline visual - Wilderness pillar', async ({ page }) => {
      // Navigate to test page with ActionHalo component
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      // Wait for component to render
      await page.waitForSelector('[data-testid="action-halo"]');
      
      // Take baseline screenshot
      await expect(page.locator('[data-testid="action-halo"]')).toHaveScreenshot('action-halo-wilderness-baseline.png');
    });

    test('ActionHalo baseline visual - Empire pillar', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=empire');
      
      await page.waitForSelector('[data-testid="action-halo"]');
      
      await expect(page.locator('[data-testid="action-halo"]')).toHaveScreenshot('action-halo-empire-baseline.png');
    });

    test('ActionHalo hover state visual', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Hover over the halo
      await halo.hover();
      
      // Wait for hover animation
      await page.waitForTimeout(200);
      
      await expect(halo).toHaveScreenshot('action-halo-hover-state.png');
    });

    test('ActionHalo active state visual', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Simulate mouse down (active state)
      await halo.dispatchEvent('mousedown');
      
      await page.waitForTimeout(100);
      
      await expect(halo).toHaveScreenshot('action-halo-active-state.png');
    });

    test('ActionHalo with custom icon', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&icon=custom');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      await expect(halo).toHaveScreenshot('action-halo-custom-icon.png');
    });

    test('ActionHalo size variants', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&size=48');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      await expect(halo).toHaveScreenshot('action-halo-large-size.png');
    });
  });

  test.describe('Drag and Drop Interactions', () => {
    test('ActionHalo drag enter visual feedback', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      const draggable = page.locator('[data-testid="draggable-item"]');
      
      await halo.waitFor();
      await draggable.waitFor();
      
      // Simulate drag enter
      await draggable.dragTo(halo);
      
      // Wait for drag feedback animation
      await page.waitForTimeout(300);
      
      await expect(halo).toHaveScreenshot('action-halo-drag-enter.png');
    });

    test('ActionHalo drag over continuous feedback', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=empire');
      
      const halo = page.locator('[data-testid="action-halo"]');
      const draggable = page.locator('[data-testid="draggable-item"]');
      
      await halo.waitFor();
      await draggable.waitFor();
      
      // Start drag and move over halo
      await draggable.hover();
      await page.mouse.down();
      
      // Move to halo center
      const haloBox = await halo.boundingBox();
      if (haloBox) {
        await page.mouse.move(
          haloBox.x + haloBox.width / 2,
          haloBox.y + haloBox.height / 2,
          { steps: 10 }
        );
      }
      
      await page.waitForTimeout(200);
      
      await expect(halo).toHaveScreenshot('action-halo-drag-over.png');
      
      // Clean up
      await page.mouse.up();
    });

    test('ActionHalo drop success feedback', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      const draggable = page.locator('[data-testid="draggable-item"]');
      
      await halo.waitFor();
      await draggable.waitFor();
      
      // Perform complete drag and drop
      await draggable.dragTo(halo);
      
      // Wait for drop feedback animation
      await page.waitForTimeout(500);
      
      await expect(halo).toHaveScreenshot('action-halo-drop-success.png');
    });

    test('ActionHalo drag leave visual feedback', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=empire');
      
      const halo = page.locator('[data-testid="action-halo"]');
      const draggable = page.locator('[data-testid="draggable-item"]');
      const outsideArea = page.locator('[data-testid="drop-area-outside"]');
      
      await halo.waitFor();
      await draggable.waitFor();
      await outsideArea.waitFor();
      
      // Drag over halo first
      await draggable.dragTo(halo);
      await page.waitForTimeout(200);
      
      // Then drag away from halo
      await halo.dragTo(outsideArea);
      
      await page.waitForTimeout(300);
      
      await expect(halo).toHaveScreenshot('action-halo-drag-leave.png');
    });
  });

  test.describe('Pillar Variant Differences', () => {
    test('Wilderness vs Empire visual comparison', async ({ page }) => {
      // Test wilderness pillar
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      await page.waitForSelector('[data-testid="action-halo"]');
      const wildernessHalo = page.locator('[data-testid="action-halo"]');
      await expect(wildernessHalo).toHaveScreenshot('action-halo-wilderness-full.png');
      
      // Test empire pillar
      await page.goto('/test?component=ActionHalo&pillar=empire');
      await page.waitForSelector('[data-testid="action-halo"]');
      const empireHalo = page.locator('[data-testid="action-halo"]');
      await expect(empireHalo).toHaveScreenshot('action-halo-empire-full.png');
    });

    test('Pillar-specific color schemes', async ({ page }) => {
      // Test wilderness colors (green tones)
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      const wildernessHalo = page.locator('[data-testid="action-halo"]');
      await wildernessHalo.waitFor();
      
      // Verify wilderness color scheme through CSS custom properties
      const wildernessColors = await wildernessHalo.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          haloColor: style.getPropertyValue('--halo-color'),
          haloGlow: style.getPropertyValue('--halo-glow'),
        };
      });
      
      expect(wildernessColors.haloColor).toContain('45, 154, 85'); // Green tones
      expect(wildernessColors.haloGlow).toContain('45, 154, 85');
      
      // Test empire colors (bronze tones)
      await page.goto('/test?component=ActionHalo&pillar=empire');
      const empireHalo = page.locator('[data-testid="action-halo"]');
      await empireHalo.waitFor();
      
      const empireColors = await empireHalo.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          haloColor: style.getPropertyValue('--halo-color'),
          haloGlow: style.getPropertyValue('--halo-glow'),
        };
      });
      
      expect(empireColors.haloColor).toContain('192, 96, 48'); // Bronze tones
      expect(empireColors.haloGlow).toContain('192, 96, 48');
    });

    test('Pillar-specific animation differences', async ({ page }) => {
      // Test wilderness animation (slower, organic)
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      const wildernessHalo = page.locator('[data-testid="action-halo"]');
      await wildernessHalo.waitFor();
      
      const wildernessAnimation = await wildernessHalo.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          pulseDuration: style.getPropertyValue('--pulse-duration'),
          entryAnimation: style.getPropertyValue('--entry-animation'),
        };
      });
      
      expect(wildernessAnimation.pulseDuration).toBe('2.5s');
      expect(wildernessAnimation.entryAnimation).toBe('scale');
      
      // Test empire animation (faster, monumental)
      await page.goto('/test?component=ActionHalo&pillar=empire');
      const empireHalo = page.locator('[data-testid="action-halo"]');
      await empireHalo.waitFor();
      
      const empireAnimation = await empireHalo.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          pulseDuration: style.getPropertyValue('--pulse-duration'),
          entryAnimation: style.getPropertyValue('--entry-animation'),
        };
      });
      
      expect(empireAnimation.pulseDuration).toBe('2s');
      expect(empireAnimation.entryAnimation).toBe('rotate');
    });
  });

  test.describe('Interaction States', () => {
    test('Click interaction sequence', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Click sequence: hover -> click -> release
      await halo.hover();
      await page.waitForTimeout(200);
      await expect(halo).toHaveScreenshot('action-halo-click-sequence-1-hover.png');
      
      await halo.click();
      await page.waitForTimeout(100);
      await expect(halo).toHaveScreenshot('action-halo-click-sequence-2-active.png');
      
      await page.waitForTimeout(300);
      await expect(halo).toHaveScreenshot('action-halo-click-sequence-3-release.png');
    });

    test('Keyboard navigation support', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=empire');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Focus with keyboard
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      await expect(halo).toHaveScreenshot('action-halo-keyboard-focus.png');
      
      // Activate with Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      await expect(halo).toHaveScreenshot('action-halo-keyboard-active.png');
    });

    test('Multiple halos interaction', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&multiple=true');
      
      const halos = page.locator('[data-testid="action-halo"]');
      await expect(halos).toHaveCount(3);
      
      // Hover over first halo
      await halos.first().hover();
      await page.waitForTimeout(200);
      
      await expect(page.locator('[data-testid="test-container"]')).toHaveScreenshot('action-halo-multiple-hover.png');
      
      // Hover over second halo
      await halos.nth(1).hover();
      await page.waitForTimeout(200);
      
      await expect(page.locator('[data-testid="test-container"]')).toHaveScreenshot('action-halo-multiple-hover-2.png');
    });
  });

  test.describe('Responsive Behavior', () => {
    test('Mobile viewport adaptation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      await expect(halo).toHaveScreenshot('action-halo-mobile.png');
    });

    test('Tablet viewport adaptation', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/test?component=ActionHalo&pillar=empire');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      await expect(halo).toHaveScreenshot('action-halo-tablet.png');
    });

    test('High DPI display scaling', async ({ page }) => {
      // Simulate high DPI display
      await page.setViewportSize({ width: 1440, height: 900 }, { deviceScaleFactor: 2 });
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      await expect(halo).toHaveScreenshot('action-halo-high-dpi.png');
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('Reduced motion support', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Should have reduced motion animations
      const hasReducedMotion = await halo.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.animation.includes('none') || style.animationDuration === '0s';
      });
      
      expect(hasReducedMotion).toBe(true);
      
      await expect(halo).toHaveScreenshot('action-halo-reduced-motion.png');
    });

    test('High contrast mode support', async ({ page }) => {
      // Enable high contrast mode
      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto('/test?component=ActionHalo&pillar=empire');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      await expect(halo).toHaveScreenshot('action-halo-high-contrast.png');
    });

    test('Screen reader announcements', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Check for proper ARIA attributes
      await expect(halo).toHaveAttribute('role', 'button');
      await expect(halo).toHaveAttribute('aria-label');
      await expect(halo).toHaveAttribute('tabindex', '0');
      
      // Test screen reader announcement on click
      await halo.click();
      
      // Verify any live region updates
      const liveRegion = page.locator('[aria-live]');
      if (await liveRegion.count() > 0) {
        await expect(liveRegion).toBeVisible();
      }
    });
  });

  test.describe('Error States and Edge Cases', () => {
    test('Missing icon fallback display', async ({ page }) => {
      await page.goto('/test?component=ActionHalo&icon=missing');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Should show default POI text
      await expect(halo.locator('text=POI')).toBeVisible();
      
      await expect(halo).toHaveScreenshot('action-halo-missing-icon.png');
    });

    test('Invalid size handling', async ({ page }) => {
      await page.goto('/test?component=ActionHalo=size=invalid');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Should fallback to default size
      await expect(halo).toHaveScreenshot('action-halo-invalid-size.png');
    });

    test('Network error resilience', async ({ page }) => {
      // Simulate network conditions
      await page.route('**/*', route => route.abort());
      
      await page.goto('/test?component=ActionHalo&pillar=wilderness');
      
      const halo = page.locator('[data-testid="action-halo"]');
      await halo.waitFor();
      
      // Component should still render with fallback styles
      await expect(halo).toBeVisible();
      await expect(halo).toHaveScreenshot('action-halo-network-error.png');
    });
  });
});
