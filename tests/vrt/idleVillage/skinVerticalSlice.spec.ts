/**
 * Visual Regression Tests for Skin Vertical Slice Integration
 * 
 * VRT tests for NP-SM-015 skin components integration
 * Tests visual consistency across pillars, motion levels, and interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Skin Vertical Slice Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="vertical-slice-test-section"]', { timeout: 10000 });
  });

  test.describe('Pillar Variants', () => {
    test('Frontier pillar baseline', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('frontier');
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-frontier-baseline.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Wilderness pillar baseline', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('wilderness');
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-wilderness-baseline.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Empire pillar baseline', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('empire');
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-empire-baseline.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });

  test.describe('Motion Levels', () => {
    test('Full motion baseline', async ({ page }) => {
      const motionSelect = page.locator('label=Motion: + select');
      await motionSelect.selectOption('full');
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-motion-full.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Reduced motion baseline', async ({ page }) => {
      const motionSelect = page.locator('label=Motion: + select');
      await motionSelect.selectOption('reduced');
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-motion-reduced.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Minimal motion baseline', async ({ page }) => {
      const motionSelect = page.locator('label=Motion: + select');
      await motionSelect.selectOption('minimal');
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-motion-minimal.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });

  test.describe('Component Details', () => {
    test('VillageRosterSectionSkin detail', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('wilderness');
      await page.waitForTimeout(1000);
      
      const rosterSection = page.locator('text=VillageRosterSectionSkin').locator('..').locator('..');
      await expect(rosterSection).toHaveScreenshot('component-village-roster-section-skin.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('ResidentSlotRackSkin detail', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('empire');
      await page.waitForTimeout(1000);
      
      const slotRack = page.locator('text=ResidentSlotRackSkin').locator('..').locator('..');
      await expect(slotRack).toHaveScreenshot('component-resident-slot-rack-skin.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('TimeEngineStrip detail', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('frontier');
      await page.waitForTimeout(1000);
      
      const timeEngine = page.locator('text=TimeEngineStrip').locator('..').locator('..');
      await expect(timeEngine).toHaveScreenshot('component-time-engine-strip.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('ActiveHUD detail', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('wilderness');
      await page.waitForTimeout(1000);
      
      const activeHud = page.locator('text=ActiveHUD').locator('..').locator('..');
      await expect(activeHud).toHaveScreenshot('component-active-hud.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('ActivityCapsule detail', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('empire');
      await page.waitForTimeout(1000);
      
      const activityCapsule = page.locator('text=ActivityCapsule').locator('..').locator('..');
      await expect(activityCapsule).toHaveScreenshot('component-activity-capsule.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('ActionHalo detail', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('frontier');
      await page.waitForTimeout(1000);
      
      const actionHalo = page.locator('text=ActionHalo').locator('..').locator('..');
      await expect(actionHalo).toHaveScreenshot('component-action-halo.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });

  test.describe('Interaction States', () => {
    test('Telemetry enabled state', async ({ page }) => {
      const telemetryToggle = page.locator('input[type="checkbox"]');
      await telemetryToggle.check();
      await page.waitForTimeout(500);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-telemetry-enabled.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Control panel focus states', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.focus();
      await page.waitForTimeout(200);
      
      const controlPanel = page.locator('[data-testid="vertical-slice-test-section"] .style-lab-stack').first();
      await expect(controlPanel).toHaveScreenshot('skin-vertical-slice-control-focus.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });

  test.describe('Responsive Layouts', () => {
    test('Mobile layout (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-mobile.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Tablet layout (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-tablet.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Desktop layout (1920x1080)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-desktop.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });

  test.describe('Pillar Color Consistency', () => {
    test('Wilderness color palette', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('wilderness');
      await page.waitForTimeout(1000);
      
      // Extract color information from CSS variables
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      const computedStyle = await skinSection.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          primaryColor: style.getPropertyValue('--style-lab-primary'),
          accentColor: style.getPropertyValue('--style-lab-accent'),
          textColor: style.getPropertyValue('--style-lab-text'),
        };
      });
      
      // Wilderness should have green/earth tones
      expect(computedStyle.primaryColor).toContain('green');
      
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-wilderness-colors.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Empire color palette', async ({ page }) => {
      const pillarSelect = page.locator('label=Pillar: + select');
      await pillarSelect.selectOption('empire');
      await page.waitForTimeout(1000);
      
      // Extract color information from CSS variables
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      const computedStyle = await skinSection.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          primaryColor: style.getPropertyValue('--style-lab-primary'),
          accentColor: style.getPropertyValue('--style-lab-accent'),
          textColor: style.getPropertyValue('--style-lab-text'),
        };
      });
      
      // Empire should have bronze/basalt tones
      expect(computedStyle.primaryColor).toContain('bronze') || 
             computedStyle.primaryColor?.includes('160') || // RGB for bronze
             computedStyle.primaryColor?.includes('192'); // RGB for bronze
      
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-empire-colors.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });

  test.describe('Animation States', () => {
    test('Full motion animations', async ({ page }) => {
      const motionSelect = page.locator('label=Motion: + select');
      await motionSelect.selectOption('full');
      
      // Enable animations for this test
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-full-motion.png', {
        fullPage: false,
        animations: 'allowed'
      });
    });

    test('Reduced motion animations', async ({ page }) => {
      const motionSelect = page.locator('label=Motion: + select');
      await motionSelect.selectOption('reduced');
      
      // Test with reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-reduced-motion.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });

  test.describe('Error States', () => {
    test('Loading state', async ({ page }) => {
      // Simulate loading by intercepting and delaying the skin preferences
      await page.route('**/api/skin-preferences', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({ status: 200, body: '{}' });
      });
      
      // Reload page to trigger loading
      await page.reload();
      await page.waitForTimeout(500);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      
      // Should show loading state
      await expect(page.locator('text=Loading skin preferences...')).toBeVisible();
      
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-loading.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });

    test('Error state', async ({ page }) => {
      // Simulate error by blocking skin preferences
      await page.route('**/api/skin-preferences', route => route.abort());
      
      // Reload page to trigger error
      await page.reload();
      await page.waitForTimeout(1000);
      
      const skinSection = page.locator('[data-testid="vertical-slice-test-section"]');
      
      // Should still show components with fallback
      await expect(skinSection).toBeVisible();
      await expect(page.locator('text=VillageRosterSectionSkin')).toBeVisible();
      
      await expect(skinSection).toHaveScreenshot('skin-vertical-slice-error.png', {
        fullPage: false,
        animations: 'disabled'
      });
    });
  });
});
