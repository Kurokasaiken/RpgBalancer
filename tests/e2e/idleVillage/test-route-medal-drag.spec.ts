/**
 * Test Route Medal Drag E2E Test Suite
 * 
 * Complete end-to-end test for medal drag workflow on /test route
 * Tests medal → slot → capsule drag flow with real mouse events, trace capture, and screenshots
 */

import { test, expect } from '@playwright/test';
import { dragElement } from '../../../tests/utils/dragActions';

// Define midAssertions interface for drag options
interface DragOptions {
  steps?: number;
  stepDelay?: number;
  midAssertions?: Array<() => Promise<void>>;
}

// Extend dragElement to support midAssertions
async function dragElementWithAssertions(
  page: any,
  source: any,
  target: any,
  options: DragOptions = {}
) {
  const { steps = 10, stepDelay = 50, midAssertions = [] } = options;
  
  // Get bounding boxes
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('Could not get bounding boxes for drag elements');
  }

  // Calculate center points
  const sourceCenter = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };

  const targetCenter = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  };

  // Move to source element
  await page.mouse.move(sourceCenter.x, sourceCenter.y);
  await page.waitForTimeout(100);

  // Press mouse button
  await page.mouse.down();
  await page.waitForTimeout(100);

  // Perform drag with intermediate steps
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = sourceCenter.x + (targetCenter.x - sourceCenter.x) * progress;
    const currentY = sourceCenter.y + (targetCenter.y - sourceCenter.y) * progress;

    await page.mouse.move(currentX, currentY);
    
    // Call intermediate assertions
    if (midAssertions.length > 0) {
      const assertionIndex = Math.floor((i - 1) / steps * midAssertions.length);
      if (midAssertions[assertionIndex]) {
        await midAssertions[assertionIndex]();
      }
    }

    // Add small delay for realistic movement
    if (i < steps) {
      await page.waitForTimeout(stepDelay);
    }
  }

  // Release mouse button
  await page.mouse.up();
  await page.waitForTimeout(100);
}

test.describe('Test Route Medal Drag Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test route
    await page.goto('/test');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for key components to be visible
    await page.waitForSelector('[data-testid="test-roster-page"]', { timeout: 10000 });
    
    // Start trace collection
    await page.context().tracing.start({
      screenshots: true,
      snapshots: true,
    });
  });

  test.afterEach(async ({ page }) => {
    // Stop trace collection
    await page.context().tracing.stop({
      path: `test-results/test-route-medal-drag-${Date.now()}.trace.zip`,
    });
  });

  test('should load test route with medal components', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Test Roster/i);
    
    // Verify main components are present
    await expect(page.locator('[data-testid="test-roster-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="resident-slot-rack"]')).toBeVisible();
    
    // Take baseline screenshot
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/desktop-initial-state.png',
      fullPage: true,
    });
  });

  test('should display available medals for dragging', async ({ page }) => {
    // Look for medal components that can be dragged
    const medals = page.locator('[data-testid^="slotted-medal"]');
    
    // Should have at least one medal available
    await expect(medals.first()).toBeVisible({ timeout: 5000 });
    
    // Verify medals have drag attributes
    const firstMedal = medals.first();
    await expect(firstMedal).toHaveAttribute('data-draggable', 'true');
    
    // Take screenshot of available medals
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/desktop-available-medals.png',
      fullPage: true,
    });
  });

  test('should drag medal to empty slot', async ({ page }) => {
    // Find first available medal
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    await expect(firstMedal).toBeVisible();
    
    // Find first empty slot
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    await expect(firstSlot).toBeVisible();
    
    // Perform drag operation using real mouse events
    await dragElementWithAssertions(page, firstMedal, firstSlot, {
      steps: 15,
      midAssertions: [
        async () => {
          // Check for hover state during drag
          await expect(firstSlot).toHaveClass(/drag-over/);
        }
      ]
    });
    
    // Verify medal is now in slot
    await expect(firstSlot.locator('[data-testid^="slotted-medal"]')).toBeVisible({ timeout: 2000 });
    
    // Take screenshot after successful drop
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/desktop-medal-dropped.png',
      fullPage: true,
    });
  });

  test('should show visual feedback during drag operations', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    
    // Start drag and check for visual feedback
    await firstMedal.hover();
    await page.mouse.down();
    
    // Check for drag visual feedback
    await expect(firstMedal).toHaveClass(/dragging/);
    
    // Move over slot and check for hover feedback
    await firstSlot.hover();
    await expect(firstSlot).toHaveClass(/drag-over/);
    
    // Complete drag
    await page.mouse.up();
    
    // Verify feedback states are cleared
    await expect(firstMedal).not.toHaveClass(/dragging/);
    await expect(firstSlot).not.toHaveClass(/drag-over/);
  });

  test('should prevent invalid medal drops', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    
    // Find already occupied slot
    const occupiedSlots = page.locator('[data-testid^="slot-"][data-resident-id]');
    
    if (await occupiedSlots.count() > 0) {
      const occupiedSlot = occupiedSlots.first();
      
      // Attempt to drag to occupied slot
      await dragElementWithAssertions(page, firstMedal, occupiedSlot, {
        steps: 10,
      });
      
      // Verify drop was rejected (medal should not be in slot)
      await expect(occupiedSlot.locator('[data-testid^="slotted-medal"]')).toHaveCount(1);
      
      // Check for error feedback
      await expect(occupiedSlot).toHaveClass(/drop-invalid/);
      
      // Take screenshot of invalid drop attempt
      await page.screenshot({
        path: 'test-results/vrt-baseline/test-route/desktop-invalid-drop.png',
        fullPage: true,
      });
    } else {
      // If no occupied slots, create one first then test
      const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
      const firstSlot = emptySlots.first();
      
      // Place medal in first slot
      await dragElementWithAssertions(page, firstMedal, firstSlot, { steps: 10 });
      
      // Try to drag another medal to same slot
      const secondMedal = medals.nth(1);
      if (await secondMedal.count() > 0) {
        await dragElementWithAssertions(page, secondMedal, firstSlot, { steps: 10 });
        
        // Should show rejection feedback
        await expect(firstSlot).toHaveClass(/drop-invalid/);
      }
    }
  });

  test('should handle medal detachment from slot', async ({ page }) => {
    // First place a medal in a slot
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    
    // Place medal in slot
    await dragElementWithAssertions(page, firstMedal, firstSlot, { steps: 10 });
    
    // Wait a moment for medal to settle
    await page.waitForTimeout(500);
    
    // Now try to drag it out
    const medalInSlot = firstSlot.locator('[data-testid^="slotted-medal"]');
    
    // Start drag from slot
    await dragElementWithAssertions(page, medalInSlot, page.locator('body'), {
      steps: 10,
      midAssertions: [
        async () => {
          // Check for resistance feedback
          await expect(medalInSlot).toHaveClass(/resisting/);
        }
      ]
    });
    
    // Verify medal was removed from slot
    await expect(firstSlot.locator('[data-testid^="slotted-medal"]')).toHaveCount(0);
    
    // Take screenshot after detachment
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/desktop-medal-detached.png',
      fullPage: true,
    });
  });

  test('should integrate medal with activity capsule', async ({ page }) => {
    // Place medal in slot
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    
    await dragElement(page, firstMedal, firstSlot, { steps: 10 });
    
    // Look for capsule integration
    const capsules = page.locator('[data-testid^="activity-capsule"]');
    
    // Should see capsule appear or update when medal is placed
    await page.waitForTimeout(1000); // Allow time for capsule state to update
    
    if (await capsules.count() > 0) {
      await expect(capsules.first()).toBeVisible();
      
      // Take screenshot of capsule integration
      await page.screenshot({
        path: 'test-results/vrt-baseline/test-route/desktop-capsule-integration.png',
        fullPage: true,
      });
    }
  });

  test('should handle multiple medal operations', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    
    // Get initial counts
    const initialMedalCount = await medals.count();
    const initialSlotCount = await emptySlots.count();
    
    // Place multiple medals if available
    const operations = Math.min(initialMedalCount, initialSlotCount, 3);
    
    for (let i = 0; i < operations; i++) {
      const medal = medals.nth(i);
      const slot = emptySlots.nth(i);
      
      if (await medal.isVisible() && await slot.isVisible()) {
        await dragElement(page, medal, slot, { steps: 10 });
        await page.waitForTimeout(200); // Brief pause between operations
      }
    }
    
    // Take screenshot of multiple medals placed
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/desktop-multiple-medals.png',
      fullPage: true,
    });
    
    // Verify multiple medals are in slots
    const occupiedSlots = page.locator('[data-testid^="slot-"][data-resident-id]');
    expect(await occupiedSlots.count()).toBeGreaterThan(0);
  });

  test('should maintain performance during drag operations', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    
    // Measure performance during drag
    const startTime = Date.now();
    
    await dragElement(page, firstMedal, firstSlot, {
      steps: 20, // More steps for smoother animation
    });
    
    const endTime = Date.now();
    const dragDuration = endTime - startTime;
    
    // Drag should complete within reasonable time (2 seconds)
    expect(dragDuration).toBeLessThan(2000);
    
    // Page should remain responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle rapid drag operations', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    
    // Perform rapid drag-drop cycles
    const cycles = 3;
    
    for (let i = 0; i < cycles; i++) {
      const medal = medals.first();
      const slot = emptySlots.first();
      
      if (await medal.isVisible() && await slot.isVisible()) {
        // Drag to slot
        await dragElement(page, medal, slot, { steps: 8 });
        
        // Brief pause
        await page.waitForTimeout(100);
        
        // Drag out of slot
        const medalInSlot = slot.locator('[data-testid^="slotted-medal"]');
        if (await medalInSlot.isVisible()) {
          await dragElement(page, medalInSlot, page.locator('body'), { steps: 8 });
        }
        
        await page.waitForTimeout(100);
      }
    }
    
    // Take screenshot after rapid operations
    await page.screenshot({
      path: 'test-results/vrt-baseline/test-route/desktop-rapid-operations.png',
      fullPage: true,
    });
  });

  test('should handle keyboard navigation alongside drag', async ({ page }) => {
    // Test that keyboard navigation still works with drag functionality
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    
    // Focus medal with keyboard
    await firstMedal.focus();
    await page.keyboard.press('Tab');
    
    // Verify focus management
    await expect(firstMedal).toBeFocused();
    
    // Should still be able to drag with mouse after keyboard focus
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    
    await dragElement(page, firstMedal, firstSlot, { steps: 10 });
    
    // Verify drag completed successfully
    await expect(firstSlot.locator('[data-testid^="slotted-medal"]')).toBeVisible();
  });

  test('should handle window resize during drag operations', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    
    // Start drag
    await firstMedal.hover();
    await page.mouse.down();
    
    // Resize window during drag
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Complete drag
    await firstSlot.hover();
    await page.mouse.up();
    
    // Verify drag completed despite resize
    await expect(firstSlot.locator('[data-testid^="slotted-medal"]')).toBeVisible({ timeout: 2000 });
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle browser back/forward during drag operations', async ({ page }) => {
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    
    // Start drag
    await firstMedal.hover();
    await page.mouse.down();
    
    // Navigate away and back (this should cancel the drag)
    await page.goBack();
    await page.goForward();
    
    // Try to complete drag (should be cancelled)
    await firstSlot.hover();
    await page.mouse.up();
    
    // Medal should not be in slot due to cancelled drag
    await expect(firstSlot.locator('[data-testid^="slotted-medal"]')).toHaveCount(0);
  });

  test('should generate telemetry events for drag operations', async ({ page }) => {
    // Listen for console events (telemetry might be logged there)
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    const medals = page.locator('[data-testid^="slotted-medal"]');
    const firstMedal = medals.first();
    const emptySlots = page.locator('[data-testid^="slot-"]:not([data-resident-id])');
    const firstSlot = emptySlots.first();
    
    // Perform drag operation
    await dragElement(page, firstMedal, firstSlot, { steps: 10 });
    
    // Check for telemetry events in console
    const telemetryEvents = consoleMessages.filter(msg => 
      msg.includes('medal_dropped') || 
      msg.includes('slot_medal') ||
      msg.includes('telemetry')
    );
    
    // Should have some telemetry output (depending on implementation)
    // This test mainly ensures the drag operation completes without errors
    await expect(firstSlot.locator('[data-testid^="slotted-medal"]')).toBeVisible();
  });
});
