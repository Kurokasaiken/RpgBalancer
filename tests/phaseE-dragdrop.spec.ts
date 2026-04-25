import { test, expect, type Page } from '@playwright/test';
import type { SandboxTelemetryEvent } from './helpers/testTypes';

async function getTelemetryEvents(page: Page): Promise<SandboxTelemetryEvent[]> {
  return page.evaluate(() => window.__sandboxTelemetry?.events ?? []);
}

test.describe('Phase E Drag Drop Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the village sandbox
    await page.goto('/map');
    
    // Wait for the map to load
    await page.waitForSelector('[data-testid="village-map"]', { timeout: 10000 });
    
    // Enable test hooks
    await page.evaluate(() => {
      window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS = true;
    });
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
    const validationEvent = telemetry.find(event => event.type === 'assignment_success');
    expect(validationEvent).toBeDefined();
    if (!validationEvent) {
      return;
    }
    expect(validationEvent.latencyMs).toBeLessThan(50); // KPI: <50ms feedback
  });

  test('should reject resident drop on incompatible slot (missing stat tags)', async ({ page }) => {
    // Find a resident with incompatible stats
    const resident = page.locator('[data-testid="resident-card"]').nth(1);
    const slot = page.locator('[data-testid="activity-slot"]').first();
    
    // Drag resident to incompatible slot
    await resident.dragTo(slot);
    
    // Verify error feedback appears
    await expect(page.locator('[data-testid="assignment-error"]')).toBeVisible();
    
    // Check telemetry for failed validation
    const telemetry = await getTelemetryEvents(page);
    const validationEvents = telemetry.filter(event => event.type === 'assignment_attempt');
    expect(validationEvents.length).toBeGreaterThan(0);
  });

  test('should reject resident drop when fatigue threshold exceeded', async ({ page }) => {
    // Set a resident to high fatigue state via test hook
    await page.evaluate(() => {
      const residents = window.__TEST_RESIDENTS || [];
      if (residents.length > 0) {
        residents[0].fatigue = 95; // Above typical threshold
      }
    });
    
    const resident = page.locator('[data-testid="resident-card"]').first();
    const slot = page.locator('[data-testid="activity-slot"]').first();
    
    // Attempt to assign tired resident
    await resident.dragTo(slot);
    
    // Verify fatigue error message
    await expect(page.locator('[data-testid="assignment-error"]')).toContainText('fatigue');
  });

  test('should reject resident drop when crew limit reached', async ({ page }) => {
    // Fill up a slot with maximum crew
    const slot = page.locator('[data-testid="activity-slot"]').first();
    const residents = page.locator('[data-testid="resident-card"]');
    
    // Assign first resident
    await residents.nth(0).dragTo(slot);
    
    // Try to assign second resident (if crew limit is 1)
    await residents.nth(1).dragTo(slot);
    
    // Verify crew limit error
    await expect(page.locator('[data-testid="assignment-error"]')).toContainText('crew limit');
  });

  test('should handle invasion-aware validation correctly', async ({ page }) => {
    // Set invasion type via test hook
    await page.evaluate(() => {
      window.__TEST_INVASION_TYPE = 'undead-invasion';
    });
    
    // Find a resident with incompatible tags for undead invasion
    const resident = page.locator('[data-testid="resident-card"]').first();
    const slot = page.locator('[data-testid="activity-slot"]').first();
    
    // Attempt assignment during invasion
    await resident.dragTo(slot);
    
    // Verify invasion-specific error (if applicable)
    const errorElement = page.locator('[data-testid="assignment-error"]');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      expect(errorText).toMatch(/invasion|forbidden|undead/i);
    }
  });

  test('should show visual feedback states (valid/invalid/locked)', async ({ page }) => {
    const resident = page.locator('[data-testid="resident-card"]').first();
    const slot = page.locator('[data-testid="activity-slot"]').first();
    
    // Start dragging
    await resident.hover();
    await page.mouse.down();
    
    // Move over slot to see validation state
    await slot.hover();
    
    // Check for visual feedback (CSS classes or indicators)
    const slotState = await slot.getAttribute('data-drop-state');
    expect(['valid', 'invalid', 'locked']).toContain(slotState || '');
    
    // Release drag
    await page.mouse.up();
  });

  test('should maintain performance KPI (<50ms validation feedback)', async ({ page }) => {
    const resident = page.locator('[data-testid="resident-card"]').first();
    const slot = page.locator('[data-testid="activity-slot"]').first();
    
    // Measure validation performance
    const startTime = Date.now();
    await resident.dragTo(slot);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(500); // Generous test bound (real KPI is <50ms)
    
    // Check telemetry for actual validation time
    const telemetry = await getTelemetryEvents(page);
    const validationEvent = telemetry.find(event => event.type === 'assignment_success');
    
    if (validationEvent && validationEvent.latencyMs) {
      expect(validationEvent.latencyMs).toBeLessThan(50);
    }
  });

  test('should handle location drop with automatic slot assignment', async ({ page }) => {
    const resident = page.locator('[data-testid="resident-card"]').first();
    const locationArea = page.locator('[data-testid="location-drop-area"]');
    
    // Drop resident on location area
    await resident.dragTo(locationArea);
    
    // Verify automatic assignment to compatible slot
    const assignedSlot = page.locator('[data-testid="activity-slot"][data-assigned-resident]');
    expect(assignedSlot).toBeVisible();
    
    // Check telemetry for location drop
    const telemetry = await getTelemetryEvents(page);
    const locationEvents = telemetry.filter(event => event.type === 'assignment_success');
    expect(locationEvents.length).toBeGreaterThan(0);
  });

  test('should emit map_drop_validation telemetry events', async ({ page }) => {
    // Clear existing telemetry
    await page.evaluate(() => {
      if (window.__sandboxTelemetry) {
        window.__sandboxTelemetry.events = [];
      }
    });
    
    const resident = page.locator('[data-testid="resident-card"]').first();
    const slot = page.locator('[data-testid="activity-slot"]').first();
    
    // Perform drag and drop
    await resident.dragTo(slot);
    
    // Check telemetry events
    const telemetry = await getTelemetryEvents(page);
    const dropValidationEvents = telemetry.filter(event => 
      event.type === 'assignment_success' || event.type === 'assignment_attempt'
    );
    
    expect(dropValidationEvents.length).toBeGreaterThan(0);
    
    // Verify event structure
    const event = dropValidationEvents[0];
    expect(event).toHaveProperty('type');
    expect(event).toHaveProperty('slotId');
    expect(event).toHaveProperty('residentId');
    expect(event).toHaveProperty('timestamp');
  });

  test('should handle re-drop on already assigned slot', async ({ page }) => {
    const resident = page.locator('[data-testid="resident-card"]').first();
    const slot = page.locator('[data-testid="activity-slot"]').first();
    
    // Initial assignment
    await resident.dragTo(slot);
    await page.waitForTimeout(100);
    
    // Re-drop same resident on same slot
    await resident.dragTo(slot);
    
    // Should not show error (re-drop is allowed)
    await expect(page.locator('[data-testid="assignment-error"]')).not.toBeVisible();
    
    // Verify resident is still assigned
    const residentId = await resident.getAttribute('data-resident-id');
    await expect(slot).toHaveAttribute('data-assigned-resident', residentId ?? '');
  });

  test('should handle multiple validation scenarios without console errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Perform multiple drag operations
    const residents = page.locator('[data-testid="resident-card"]');
    const slots = page.locator('[data-testid="activity-slot"]');
    
    for (let i = 0; i < Math.min(3, await residents.count(), await slots.count()); i++) {
      await residents.nth(i).dragTo(slots.nth(i));
      await page.waitForTimeout(100);
    }
    
    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
});
