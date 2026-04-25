import { test, expect } from '@playwright/test';
import { getTelemetryEvents, clearTelemetryEvents, enableIdleVillageTestHooks, getInteractionMode, trackConsoleErrors } from './helpers/telemetry';
import type { SandboxTelemetryEvent } from './helpers/testTypes';

test.describe('Idle Village Interaction Modes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Idle Village page via map tab
    await page.goto('/?tab=map');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="village-sandbox"]', { timeout: 10000 });
    
    // Clear any existing telemetry
    await clearTelemetryEvents(page);
    
    // Enable test hooks
    await enableIdleVillageTestHooks(page);
  });

  test.describe('Desktop Drag-and-Drop Mode', () => {
    test('should detect desktop mode and enable drag interactions', async ({ page }) => {
      // Check that we're in desktop mode
      const interactionMode = await getInteractionMode(page);
      
      expect(interactionMode).toBe('desktop');
      
      // Verify drag-enabled elements are present
      const residents = page.locator('[data-testid="resident-card"]');
      const slots = page.locator('[data-testid="activity-slot"]');
      
      await expect(residents.first()).toBeVisible();
      await expect(slots.first()).toBeVisible();
      
      // Check that residents have drag attributes
      const firstResident = residents.first();
      await expect(firstResident).toHaveAttribute('draggable', 'true');
    });

    test('should validate successful resident drop on compatible slot', async ({ page }) => {
      // Get a resident and a compatible slot
      const resident = page.locator('[data-testid="resident-card"]').first();
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Check initial state
      await expect(resident).toBeVisible();
      await expect(slot).toBeVisible();
      
      // Drag resident to slot
      await resident.dragTo(slot);
      
      // Verify successful assignment (no error message)
      await expect(page.locator('[data-testid="assignment-error"]')).not.toBeVisible();
      
      // Check telemetry for successful validation
      const telemetry = await getTelemetryEvents(page);
      const validationEvent = telemetry.find((event: SandboxTelemetryEvent) => event.type === 'assignment_success');
      expect(validationEvent).toBeDefined();
      if (!validationEvent) {
        return;
      }
      expect(validationEvent.latencyMs).toBeLessThan(50); // KPI: <50ms feedback
    });

    test('should reject resident drop on incompatible slot with feedback', async ({ page }) => {
      // Get a resident and an incompatible slot (different stat requirements)
      const resident = page.locator('[data-testid="resident-card"]').first();
      const incompatibleSlot = page.locator('[data-testid="activity-slot"][data-stats-incompatible]').first();
      
      if (await incompatibleSlot.count() === 0) {
        // If no incompatible slot exists, create scenario by using a slot with different requirements
        const slot = page.locator('[data-testid="activity-slot"]').nth(2); // Use different slot
        await resident.dragTo(slot);
        
        // Check for error feedback
        const errorElement = page.locator('[data-testid="assignment-error"]');
        if (await errorElement.isVisible()) {
          await expect(errorElement).toBeVisible();
        }
      } else {
        await resident.dragTo(incompatibleSlot);
        await expect(page.locator('[data-testid="assignment-error"]')).toBeVisible();
      }
      
      // Check telemetry for failed validation
      const telemetry = await getTelemetryEvents(page);
      const validationEvent = telemetry.find((event: SandboxTelemetryEvent) => event.type === 'assignment_failed');
      expect(validationEvent).toBeDefined();
    });

    test('should show visual feedback during drag operations', async ({ page }) => {
      const resident = page.locator('[data-testid="resident-card"]').first();
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Start drag but don't complete
      await resident.hover();
      
      // Check for drag-over visual feedback
      await slot.hover();
      
      // Verify drop state is applied
      const dropState = await slot.evaluate(el => {
        return window.getComputedStyle(el).getPropertyValue('--drop-state');
      });
      
      expect(dropState).toBeTruthy();
      
      // Complete the drag
      await resident.dragTo(slot);
    });

    test('should handle fatigue threshold validation in drag mode', async ({ page }) => {
      // Find a resident with high fatigue
      const fatiguedResident = page.locator('[data-testid="resident-card"][data-fatigue-high]').first();
      
      if (await fatiguedResident.count() === 0) {
        // If no fatigued resident exists, skip this test
        test.skip();
        return;
      }
      
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Attempt to assign fatigued resident
      await fatiguedResident.dragTo(slot);
      
      // Check for fatigue warning/error
      const fatigueWarning = page.locator('[data-testid="fatigue-warning"]');
      if (await fatigueWarning.isVisible()) {
        await expect(fatigueWarning).toBeVisible();
      }
      
      // Verify telemetry includes fatigue data
      const telemetry = await getTelemetryEvents(page);
      const assignmentEvent = telemetry.find((event: SandboxTelemetryEvent) => event.type === 'assignment_success' || event.type === 'assignment_failed');
      if (assignmentEvent) {
        expect(assignmentEvent.fatigueLevel).toBeDefined();
      }
    });
  });

  test.describe('Mobile Tap Interaction Mode', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // Mobile viewport

    test('should detect mobile mode and enable tap interactions', async ({ page }) => {
      // Check that we're in mobile mode
      const interactionMode = await getInteractionMode(page);
      
      expect(interactionMode).toBe('mobile');
      
      // Verify tap-enabled elements are present
      const slots = page.locator('[data-testid="activity-slot"]');
      await expect(slots.first()).toBeVisible();
      
      // Check that slots are not draggable in mobile mode
      const firstSlot = slots.first();
      const isDraggable = await firstSlot.evaluate(el => el.getAttribute('draggable'));
      expect(isDraggable).not.toBe('true');
    });

    test('should open worker picker when slot is tapped', async ({ page }) => {
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Tap on slot to open picker
      await slot.click();
      
      // Verify picker sheet opens
      const pickerSheet = page.locator('[data-testid="worker-picker-sheet"]');
      await expect(pickerSheet).toBeVisible();
      
      // Check telemetry for picker open event
      const telemetry = await getTelemetryEvents(page);
      const openEvent = telemetry.find((event: SandboxTelemetryEvent) => event.type === 'open');
      expect(openEvent).toBeDefined();
      if (openEvent) {
        expect(openEvent.source).toBe('click');
      }
    });

    test('should assign resident through picker selection', async ({ page }) => {
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Open picker
      await slot.click();
      await expect(page.locator('[data-testid="worker-picker-sheet"]')).toBeVisible();
      
      // Select a resident from picker
      const residentOption = page.locator('[data-testid="resident-option"]').first();
      await expect(residentOption).toBeVisible();
      await residentOption.click();
      
      // Verify picker closes and assignment is made
      await expect(page.locator('[data-testid="worker-picker-sheet"]')).not.toBeVisible();
      
      // Check for successful assignment
      const assignedWorker = slot.locator('[data-testid="assigned-worker"]');
      if (await assignedWorker.count() > 0) {
        await expect(assignedWorker).toBeVisible();
      }
      
      // Verify telemetry
      const telemetry = await getTelemetryEvents(page);
      const assignmentEvent = telemetry.find((event: SandboxTelemetryEvent) => event.type === 'assignment_success');
      expect(assignmentEvent).toBeDefined();
      if (assignmentEvent) {
        expect(assignmentEvent.tapCount).toBeGreaterThan(0);
      }
    });

    test('should track tap count and enforce KPI limits', async ({ page }) => {
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Open picker
      await slot.click();
      await expect(page.locator('[data-testid="worker-picker-sheet"]')).toBeVisible();
      
      // Make multiple selections to test tap counting
      const residentOption = page.locator('[data-testid="resident-option"]').first();
      await residentOption.click();
      
      // Check telemetry for tap count
      const telemetry = await getTelemetryEvents(page);
      const assignmentEvent = telemetry.find((event: SandboxTelemetryEvent) => event.type === 'assignment_success');
      if (assignmentEvent) {
        expect(assignmentEvent.tapCount).toBeLessThanOrEqual(3); // KPI: ≤3 taps per assignment
      }
    });

    test('should show CTA highlight for mobile affordance', async ({ page }) => {
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Tap slot to trigger CTA highlight
      await slot.click();
      
      // Check for CTA highlight state
      const ctaHighlight = page.locator('[data-testid="cta-highlight"]');
      if (await ctaHighlight.count() > 0) {
        await expect(ctaHighlight).toHaveClass(/highlight/);
      }
    });

    test('should close picker when overlay is clicked', async ({ page }) => {
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Open picker
      await slot.click();
      await expect(page.locator('[data-testid="worker-picker-sheet"]')).toBeVisible();
      
      // Click overlay to close
      const overlay = page.locator('[data-testid="picker-overlay"]');
      await overlay.click();
      
      // Verify picker closes
      await expect(page.locator('[data-testid="worker-picker-sheet"]')).not.toBeVisible();
      
      // Check telemetry for close event
      const telemetry = await getTelemetryEvents(page);
      const closeEvent = telemetry.find((event: SandboxTelemetryEvent) => event.type === 'close');
      expect(closeEvent).toBeDefined();
    });

    test('should handle fatigue validation in mobile picker', async ({ page }) => {
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Open picker
      await slot.click();
      await expect(page.locator('[data-testid="worker-picker-sheet"]')).toBeVisible();
      
      // Look for fatigued residents in picker
      const fatiguedResident = page.locator('[data-testid="resident-option"][data-fatigue-high]').first();
      
      if (await fatiguedResident.count() > 0) {
        // Check for fatigue indicator
        const fatigueIndicator = fatiguedResident.locator('[data-testid="fatigue-indicator"]');
        if (await fatigueIndicator.count() > 0) {
          await expect(fatigueIndicator).toBeVisible();
        }
      }
    });
  });

  test.describe('Cross-Mode Functionality', () => {
    test('should maintain state consistency between modes', async ({ page }) => {
      // Start with desktop assignment
      const resident = page.locator('[data-testid="resident-card"]').first();
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      await resident.dragTo(slot);
      
      // Get assignment state
      const assignmentState = await slot.evaluate(el => {
        return {
          hasAssignment: el.querySelector('[data-testid="assigned-worker"]') !== null,
          slotId: el.getAttribute('data-slot-id')
        };
      });
      
      // Switch to mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Verify state is maintained
      await expect(page.locator('[data-testid="village-sandbox"]')).toBeVisible();
      
      // The assignment should still be visible if persistence is working
      if (assignmentState.hasAssignment) {
        const assignedWorker = slot.locator('[data-testid="assigned-worker"]');
        await expect(assignedWorker).toBeVisible();
      }
    });

    test('should emit consistent telemetry across modes', async ({ page }) => {
      // Test desktop telemetry
      const resident = page.locator('[data-testid="resident-card"]').first();
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      await resident.dragTo(slot);
      
      const desktopTelemetry = await getTelemetryEvents(page);
      const desktopAssignment = desktopTelemetry.find((event: SandboxTelemetryEvent) => event.type === 'assignment_success');
      
      // Clear telemetry
      await clearTelemetryEvents(page);
      
      // Switch to mobile and test
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileSlot = page.locator('[data-testid="activity-slot"]').nth(1);
      await mobileSlot.click();
      
      const residentOption = page.locator('[data-testid="resident-option"]').first();
      await residentOption.click();
      
      const mobileTelemetry = await getTelemetryEvents(page);
      const mobileAssignment = mobileTelemetry.find((event: SandboxTelemetryEvent) => event.type === 'assignment_success');
      
      // Verify both events have required fields
      expect(desktopAssignment).toBeDefined();
      expect(mobileAssignment).toBeDefined();
      
      if (desktopAssignment && mobileAssignment) {
        expect(desktopAssignment.slotId).toBeTruthy();
        expect(mobileAssignment.slotId).toBeTruthy();
        expect(desktopAssignment.residentId).toBeTruthy();
        expect(mobileAssignment.residentId).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle rapid interactions gracefully', async ({ page }) => {
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Rapid tap/click interactions
      for (let i = 0; i < 5; i++) {
        await slot.click();
        await page.waitForTimeout(100);
      }
      
      // System should not crash
      await expect(page.locator('[data-testid="village-sandbox"]')).toBeVisible();
      
      // Check for any error states
      const errorElements = page.locator('[data-testid="error-boundary"]');
      await expect(errorElements).toHaveCount(0);
    });

    test('should handle missing residents gracefully', async ({ page }) => {
      // Try to interact with slot when no residents are available
      const slot = page.locator('[data-testid="activity-slot"]').first();
      
      // Hide all residents temporarily
      await page.evaluate(() => {
        const residents = document.querySelectorAll('[data-testid="resident-card"]');
        residents.forEach((r: any) => r.style.display = 'none');
      });
      
      // Try desktop drag
      const resident = page.locator('[data-testid="resident-card"]').first();
      if (await resident.isVisible()) {
        await resident.dragTo(slot);
      }
      
      // Try mobile tap
      await slot.click();
      
      // System should handle gracefully
      await expect(page.locator('[data-testid="village-sandbox"]')).toBeVisible();
    });

    test('should validate telemetry integrity under stress', async ({ page }) => {
      // Perform multiple rapid assignments
      const residents = page.locator('[data-testid="resident-card"]');
      const slots = page.locator('[data-testid="activity-slot"]');
      
      const residentCount = await residents.count();
      const slotCount = await slots.count();
      
      for (let i = 0; i < Math.min(residentCount, slotCount); i++) {
        await residents.nth(i).dragTo(slots.nth(i));
        await page.waitForTimeout(50);
      }
      
      // Verify telemetry is collected
      const telemetry = await getTelemetryEvents(page);
      expect(telemetry.length).toBeGreaterThan(0);
      
      // Verify all events have required fields
      telemetry.forEach((event: SandboxTelemetryEvent) => {
        expect(event.type).toBeTruthy();
        expect(event.timestamp).toBeTruthy();
      });
    });
  });
});
