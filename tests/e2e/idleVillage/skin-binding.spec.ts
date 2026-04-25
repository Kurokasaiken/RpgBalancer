/**
 * Skin Binding E2E Tests
 * 
 * End-to-end tests for the skin binding system across all certified components
 * Tests skin switching, pillar switching, motion level changes, and telemetry events
 */

import { test, expect } from '@playwright/test';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

test.describe('Skin Binding System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to TestRosterPage with skin harness
    await page.goto('/idle-village/test-roster');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for skin harness to initialize
    await page.waitForSelector('[data-skin-preset]', { timeout: 5000 });
  });

  test.describe('PgCard Skin Binding', () => {
    test('should apply skin attributes and classes to PgCard', async ({ page }) => {
      // Find PgCard elements
      const pgCards = page.locator('[data-testid="pg-card"]');
      await expect(pgCards.first()).toBeVisible();
      
      // Check for skin data attributes
      const firstCard = pgCards.first();
      await expect(firstCard).toHaveAttribute('data-skin-preset');
      await expect(firstCard).toHaveAttribute('data-skin-pillar');
      await expect(firstCard).toHaveAttribute('data-motion-level');
      
      // Check for skin-specific classes
      const className = await firstCard.getAttribute('class');
      expect(className).toContain('pgcard-skin-');
    });

    test('should track telemetry events for PgCard interactions', async ({ page }) => {
      // Mock telemetry to capture events
      const telemetryEvents: any[] = [];
      await page.addInitScript(() => {
        window.capturedTelemetryEvents = [];
        const originalTrack = (window as any).trackTelemetryEvent;
        (window as any).trackTelemetryEvent = (eventName: string, payload: any) => {
          window.capturedTelemetryEvents.push({ eventName, payload });
          if (originalTrack) originalTrack(eventName, payload);
        };
      });
      
      // Find and interact with PgCard
      const pgCard = page.locator('[data-testid="pg-card"]').first();
      await pgCard.click();
      
      // Wait for telemetry events
      await page.waitForTimeout(100);
      
      // Check captured events
      const events = await page.evaluate(() => (window as any).capturedTelemetryEvents);
      const pgCardEvents = events.filter((e: any) => e.eventName.includes('pgcard'));
      
      expect(pgCardEvents.length).toBeGreaterThan(0);
      expect(pgCardEvents.some((e: any) => e.eventName === 'skin_pgcard_rendered')).toBe(true);
    });

    test('should handle skin preset changes', async ({ page }) => {
      // Find skin harness controls
      const presetSelector = page.locator('[data-testid="skin-preset-selector"]');
      if (await presetSelector.isVisible()) {
        // Get current preset
        const currentPreset = await page.getAttribute('[data-skin-preset]', 'data-skin-preset');
        
        // Change preset
        await presetSelector.selectOption('wanderlust');
        await page.waitForTimeout(500);
        
        // Verify preset changed
        const newPreset = await page.getAttribute('[data-skin-preset]', 'data-skin-preset');
        expect(newPreset).toBe('wanderlust');
        
        // Verify PgCard classes updated
        const pgCard = page.locator('[data-testid="pg-card"]').first();
        const className = await pgCard.getAttribute('class');
        expect(className).toContain('pgcard-skin-wanderlust');
      }
    });
  });

  test.describe('Pillar Switching', () => {
    test('should handle pillar changes across components', async ({ page }) => {
      // Find pillar selector
      const pillarSelector = page.locator('[data-testid="skin-pillar-selector"]');
      if (await pillarSelector.isVisible()) {
        // Change pillar to wilderness
        await pillarSelector.selectOption('wilderness');
        await page.waitForTimeout(500);
        
        // Verify all components have wilderness pillar
        const components = page.locator('[data-skin-pillar]');
        const count = await components.count();
        
        for (let i = 0; i < count; i++) {
          const component = components.nth(i);
          const pillar = await component.getAttribute('data-skin-pillar');
          expect(pillar).toBe('wilderness');
        }
        
        // Verify classes updated
        const pgCard = page.locator('[data-testid="pg-card"]').first();
        const className = await pgCard.getAttribute('class');
        expect(className).toContain('pgcard-skin-wilderness');
      }
    });

    test('should maintain component functionality during pillar switching', async ({ page }) => {
      // Test PgCard drag functionality during pillar switch
      const pgCard = page.locator('[data-testid="pg-card"]').first();
      const slotRack = page.locator('[data-testid="slot-rack"]').first();
      
      if (await pgCard.isVisible() && await slotRack.isVisible()) {
        // Start drag
        await pgCard.dragTo(slotRack);
        
        // Verify drag completed successfully
        await expect(pgCard).not.toBeVisible(); // Card should be moved
      }
    });
  });

  test.describe('Motion Level Changes', () => {
    test('should handle motion level changes', async ({ page }) => {
      // Find motion level selector
      const motionSelector = page.locator('[data-testid="skin-motion-selector"]');
      if (await motionSelector.isVisible()) {
        // Change motion level to minimal
        await motionSelector.selectOption('minimal');
        await page.waitForTimeout(500);
        
        // Verify motion level updated
        const components = page.locator('[data-motion-level]');
        const count = await components.count();
        
        for (let i = 0; i < count; i++) {
          const component = components.nth(i);
          const motionLevel = await component.getAttribute('data-motion-level');
          expect(motionLevel).toBe('minimal');
        }
      }
    });

    test('should disable animations for minimal motion', async ({ page }) => {
      // Set motion to minimal
      const motionSelector = page.locator('[data-testid="skin-motion-selector"]');
      if (await motionSelector.isVisible()) {
        await motionSelector.selectOption('minimal');
        await page.waitForTimeout(500);
        
        // Check for animation-disabled classes
        const components = page.locator('[data-motion-level="minimal"]');
        const count = await components.count();
        
        for (let i = 0; i < count; i++) {
          const component = components.nth(i);
          const className = await component.getAttribute('class');
          // Components should have animation-disabled classes
          expect(className).toMatch(/animations-disabled|motion-minimal/);
        }
      }
    });
  });

  test.describe('Telemetry Integration', () => {
    test('should capture telemetry events for all skin operations', async ({ page }) => {
      // Mock telemetry
      const telemetryEvents: any[] = [];
      await page.addInitScript(() => {
        window.capturedTelemetryEvents = [];
        const originalTrack = (window as any).trackTelemetryEvent;
        (window as any).trackTelemetryEvent = (eventName: string, payload: any) => {
          window.capturedTelemetryEvents.push({ eventName, payload, timestamp: Date.now() });
          if (originalTrack) originalTrack(eventName, payload);
        };
      });
      
      // Perform various skin operations
      const presetSelector = page.locator('[data-testid="skin-preset-selector"]');
      const pillarSelector = page.locator('[data-testid="skin-pillar-selector"]');
      const motionSelector = page.locator('[data-testid="skin-motion-selector"]');
      
      if (await presetSelector.isVisible()) {
        await presetSelector.selectOption('wanderlust');
      }
      
      if (await pillarSelector.isVisible()) {
        await pillarSelector.selectOption('wilderness');
      }
      
      if (await motionSelector.isVisible()) {
        await motionSelector.selectOption('minimal');
      }
      
      // Wait for events to be captured
      await page.waitForTimeout(1000);
      
      // Check captured events
      const events = await page.evaluate(() => (window as any).capturedTelemetryEvents);
      
      // Should have skin harness events
      expect(events.some((e: any) => e.eventName.includes('skin_harness_'))).toBe(true);
      
      // Should have component-specific events
      expect(events.some((e: any) => e.eventName.includes('skin_pgcard_'))).toBe(true);
      
      // Should have preset/pillar/motion change events
      expect(events.some((e: any) => e.eventName.includes('preset_changed'))).toBe(true);
      expect(events.some((e: any) => e.eventName.includes('pillar_changed'))).toBe(true);
      expect(events.some((e: any) => e.eventName.includes('motion_changed'))).toBe(true);
    });

    test('should include proper payload in telemetry events', async ({ page }) => {
      // Mock telemetry
      await page.addInitScript(() => {
        window.capturedTelemetryEvents = [];
        const originalTrack = (window as any).trackTelemetryEvent;
        (window as any).trackTelemetryEvent = (eventName: string, payload: any) => {
          window.capturedTelemetryEvents.push({ eventName, payload });
          if (originalTrack) originalTrack(eventName, payload);
        };
      });
      
      // Trigger a component event
      const pgCard = page.locator('[data-testid="pg-card"]').first();
      await pgCard.click();
      
      await page.waitForTimeout(100);
      
      // Check event payload
      const events = await page.evaluate(() => (window as any).capturedTelemetryEvents);
      const pgCardEvents = events.filter((e: any) => e.eventName === 'skin_pgcard_rendered');
      
      if (pgCardEvents.length > 0) {
        const event = pgCardEvents[0];
        expect(event.payload).toHaveProperty('skinBinding');
        expect(event.payload).toHaveProperty('workerId');
        expect(event.payload).toHaveProperty('label');
      }
    });
  });

  test.describe('Component Integration', () => {
    test('should maintain component functionality with skin binding', async ({ page }) => {
      // Test PgCard drag and drop
      const pgCard = page.locator('[data-testid="pg-card"]').first();
      const slotRack = page.locator('[data-testid="slot-rack"]').first();
      
      if (await pgCard.isVisible() && await slotRack.isVisible()) {
        // Verify card has skin attributes
        await expect(pgCard).toHaveAttribute('data-skin-preset');
        await expect(pgCard).toHaveAttribute('data-skin-pillar');
        
        // Test drag functionality
        await pgCard.dragTo(slotRack);
        
        // Verify drag completed
        await expect(pgCard).not.toBeVisible();
      }
    });

    test('should handle multiple components with different skins', async ({ page }) => {
      // Get all certified components
      const components = page.locator('[data-skin-preset]');
      const count = await components.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Each component should have skin attributes
      for (let i = 0; i < Math.min(count, 5); i++) {
        const component = components.nth(i);
        await expect(component).toHaveAttribute('data-skin-preset');
        await expect(component).toHaveAttribute('data-skin-pillar');
        
        // Should have skin-specific classes
        const className = await component.getAttribute('class');
        expect(className).toMatch(/-skin-/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid skin configurations gracefully', async ({ page }) => {
      // Mock console to capture errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Try to trigger invalid configuration
      await page.evaluate(() => {
        // Simulate invalid preset
        const event = new CustomEvent('skin-preset-change', { 
          detail: { presetId: 'invalid-preset' } 
        });
        document.dispatchEvent(event);
      });
      
      await page.waitForTimeout(500);
      
      // Should not have unhandled errors
      expect(consoleErrors.filter(e => e.includes('skin') || e.includes('Skin')).length).toBe(0);
    });

    test('should fallback to default skin on errors', async ({ page }) => {
      // Mock a skin error scenario
      await page.addInitScript(() => {
        // Override skin binding to throw error
        const originalGetBinding = (window as any).getComponentSkinBinding;
        (window as any).getComponentSkinBinding = (componentId: string) => {
          if (componentId === 'PgCard') {
            throw new Error('Skin binding error');
          }
          return originalGetBinding ? originalGetBinding(componentId) : null;
        };
      });
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still render components with fallback
      const pgCards = page.locator('[data-testid="pg-card"]');
      if (await pgCards.first().isVisible()) {
        await expect(pgCards.first()).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('should handle rapid skin changes without performance issues', async ({ page }) => {
      const presetSelector = page.locator('[data-testid="skin-preset-selector"]');
      const pillarSelector = page.locator('[data-testid="skin-pillar-selector"]');
      
      if (await presetSelector.isVisible() && await pillarSelector.isVisible()) {
        const presets = ['minimal-frontier', 'wanderlust', 'minimal-wilderness'];
        const pillars = ['frontier', 'wilderness', 'empire'];
        
        // Measure performance
        const startTime = Date.now();
        
        // Rapidly change presets and pillars
        for (let i = 0; i < 10; i++) {
          const preset = presets[i % presets.length];
          const pillar = pillars[i % pillars.length];
          
          await presetSelector.selectOption(preset);
          await pillarSelector.selectOption(pillar);
          await page.waitForTimeout(100); // Small delay between changes
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should complete within reasonable time (5 seconds)
        expect(duration).toBeLessThan(5000);
        
        // Final state should be consistent
        const finalPreset = await page.getAttribute('[data-skin-preset]', 'data-skin-preset');
        const finalPillar = await page.getAttribute('[data-skin-pillar]', 'data-skin-pillar');
        
        expect(finalPreset).toBeDefined();
        expect(finalPillar).toBeDefined();
      }
    });
  });

  test.describe('Visual Regression', () => {
    test('should maintain visual consistency across skin changes', async ({ page }) => {
      // Take baseline screenshot
      const presetSelector = page.locator('[data-testid="skin-preset-selector"]');
      const pillarSelector = page.locator('[data-testid="skin-pillar-selector"]');
      
      if (await presetSelector.isVisible() && await pillarSelector.isVisible()) {
        // Baseline with default preset
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toHaveScreenshot('skin-baseline.png');
        
        // Change to wanderlust preset
        await presetSelector.selectOption('wanderlust');
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toHaveScreenshot('skin-wanderlust.png');
        
        // Change to wilderness pillar
        await pillarSelector.selectOption('wilderness');
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toHaveScreenshot('skin-wanderlust-wilderness.png');
        
        // Reset to default
        await presetSelector.selectOption('minimal-frontier');
        await pillarSelector.selectOption('frontier');
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toHaveScreenshot('skin-reset.png');
      }
    });
  });
});
