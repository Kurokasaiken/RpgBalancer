import { test, expect } from '@playwright/test';

// Test configuration - use same route as main test suite
const TEST_ROUTE = '/test';

// Type declarations for window object
declare global {
  interface Window {
    poiCapsuleData: {
      status: 'idle' | 'in-progress' | 'completed';
      canCollect: boolean;
      progressFraction: number;
      slots: Array<{ isOccupied: boolean }>;
    };
  }
}

/**
 * Roster Slot POI Integration Test Suite
 * 
 * Tests the complete integration between:
 * 1. Roster (PG cards)
 * 2. Slot Assignment System (Rack A/B)
 * 3. POI (Activity Capsule with timer, halo, collect)
 */

test.describe('Roster Slot POI Integration Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_ROUTE);
    await page.waitForLoadState('networkidle');
    
    // Wait for core components to be visible
    await expect(page.locator('[data-testid="pg-card"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="activity-capsule"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test.describe('Component Visibility & Initial State', () => {
    test('should display all three core components', async ({ page }) => {
      // Roster Component
      const residentCards = page.locator('[data-testid="pg-card"]');
      await expect(residentCards.first()).toBeVisible();
      const residentCount = await residentCards.count();
      expect(residentCount).toBeGreaterThan(0);

      // Slot Component
      const rackSlots = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]');
      await expect(rackSlots.first()).toBeVisible();
      const slotCount = await rackSlots.count();
      expect(slotCount).toBeGreaterThan(0);

      // POI Component
      const poiCapsule = page.locator('[data-testid="activity-capsule"]');
      await expect(poiCapsule).toBeVisible();
      await expect(poiCapsule).toContainText('Gold Mine · POI Test');
    });

    test('should have correct initial states', async ({ page }) => {
      // Check POI initial state
      const initialPoiState = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? {
          status: poiData.status,
          canCollect: poiData.canCollect,
          progress: poiData.progressFraction,
          slotsOccupied: poiData.slots?.filter((s: any) => s.isOccupied)?.length || 0
        } : null;
      });

      expect(initialPoiState).not.toBeNull();
      expect(initialPoiState!.status).toBe('idle');
      expect(initialPoiState!.canCollect).toBe(false);
      expect(initialPoiState!.progress).toBe(0);
      expect(initialPoiState!.slotsOccupied).toBe(0);

      // Check slots initial state
      const rackSlots = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]');
      for (let i = 0; i < await rackSlots.count(); i++) {
        const slot = rackSlots.nth(i);
        await expect(slot).toContainText(/Slot \d+/); // Should show slot number, not resident name
      }
    });
  });

  test.describe('Roster → Slot Assignment', () => {
    test('should assign resident from roster to slot', async ({ page }) => {
      const residentCard = page.locator('[data-testid="pg-card"]').first();
      const rackSlot = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]').first();

      // Get initial slot text
      const initialSlotText = await rackSlot.textContent();
      expect(initialSlotText).toMatch(/Slot \d+/);

      // Perform drag and drop
      await dragElement(page, residentCard, rackSlot);
      await page.waitForTimeout(1000);

      // Verify assignment
      const finalSlotText = await rackSlot.textContent();
      expect(finalSlotText).not.toMatch(/Slot \d+/); // Should show resident name
      
      // Verify POI state changed
      const poiState = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? {
          status: poiData.status,
          slotsOccupied: poiData.slots?.filter((s: any) => s.isOccupied)?.length || 0
        } : null;
      });

      expect(poiState!.slotsOccupied).toBeGreaterThan(0);
    });

    test('should handle multiple resident assignments', async ({ page }) => {
      const residentCards = page.locator('[data-testid="pg-card"]');
      const rackSlots = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]');

      // Assign first 3 residents
      const assignmentsToMake = Math.min(3, await residentCards.count(), await rackSlots.count());
      
      for (let i = 0; i < assignmentsToMake; i++) {
        await dragElement(page, residentCards.nth(i), rackSlots.nth(i));
        await page.waitForTimeout(500);
      }

      // Verify all assignments
      let occupiedSlots = 0;
      for (let i = 0; i < assignmentsToMake; i++) {
        const slotText = await rackSlots.nth(i).textContent();
        if (!slotText?.match(/Slot \d+/)) {
          occupiedSlots++;
        }
      }

      expect(occupiedSlots).toBe(assignmentsToMake);

      // Verify POI tracks all assignments
      const poiState = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? poiData.slots?.filter((s: any) => s.isOccupied)?.length || 0 : 0;
      });

      expect(poiState).toBe(assignmentsToMake);
    });
  });

  test.describe('Slot → POI Timer Integration', () => {
    test('should start POI timer when residents assigned', async ({ page }) => {
      // Assign resident
      const residentCard = page.locator('[data-testid="pg-card"]').first();
      const rackSlot = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]').first();
      
      await dragElement(page, residentCard, rackSlot);
      await page.waitForTimeout(1000);

      // Check timer started
      const progressAfterAssignment = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? poiData.progressFraction : 0;
      });

      expect(progressAfterAssignment).toBeGreaterThan(0);

      // Wait a bit and check progress increases
      await page.waitForTimeout(3000);
      
      const progressAfterDelay = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? poiData.progressFraction : 0;
      });

      expect(progressAfterDelay).toBeGreaterThan(progressAfterAssignment);
    });

    test('should not start timer without residents', async ({ page }) => {
      // Check initial progress
      const initialProgress = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? poiData.progressFraction : 0;
      });

      expect(initialProgress).toBe(0);

      // Wait 5 seconds and verify no progress
      await page.waitForTimeout(5000);
      
      const progressAfterWait = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? poiData.progressFraction : 0;
      });

      expect(progressAfterWait).toBe(0);
    });
  });

  test.describe('POI Timer → Collect Flow', () => {
    test('should complete timer and show collect button', async ({ page }) => {
      // Assign resident
      const residentCard = page.locator('[data-testid="pg-card"]').first();
      const rackSlot = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]').first();
      
      await dragElement(page, residentCard, rackSlot);
      await page.waitForTimeout(1000);

      // Wait for timer completion (1 minute + buffer)
      await page.waitForFunction(() => {
        const poiData = window.poiCapsuleData;
        return poiData && poiData.status === 'completed';
      }, undefined, { timeout: 70_000 });

      // Verify completion state
      const finalPoiState = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? {
          status: poiData.status,
          canCollect: poiData.canCollect,
          progress: poiData.progressFraction
        } : null;
      });

      expect(finalPoiState!.status).toBe('completed');
      expect(finalPoiState!.progress).toBe(1);
      expect(finalPoiState!.canCollect).toBe(true);

      // Verify collect button
      const collectButton = page.locator('.activity-capsule__cta');
      await expect(collectButton).toBeVisible({ timeout: 5_000 });
      await expect(collectButton).toContainText('Raccogli oro');
    });

    test('should calculate rewards correctly based on assigned residents', async ({ page }) => {
      // Assign 2 residents
      const residentCards = page.locator('[data-testid="pg-card"]');
      const rackSlots = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]');
      
      await dragElement(page, residentCards.first(), rackSlots.first());
      await page.waitForTimeout(500);
      
      await dragElement(page, residentCards.nth(1), rackSlots.nth(1));
      await page.waitForTimeout(1000);

      // Wait for completion
      await page.waitForFunction(() => {
        const poiData = window.poiCapsuleData;
        return poiData && poiData.status === 'completed';
      }, undefined, { timeout: 70_000 });

      // Get gold before collect
      const goldBefore = await page.evaluate(() => {
        const goldElement = document.querySelector('[data-testid*="gold"], [class*="gold"]');
        if (goldElement) {
          const text = goldElement.textContent || '';
          const match = text.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }
        return 0;
      });

      // Collect rewards
      const collectButton = page.locator('.activity-capsule__cta');
      await collectButton.click();
      await page.waitForTimeout(1000);

      // Verify reward calculation (2 residents × 4 gold = 8)
      const goldAfter = await page.evaluate(() => {
        const goldElement = document.querySelector('[data-testid*="gold"], [class*="gold"]');
        if (goldElement) {
          const text = goldElement.textContent || '';
          const match = text.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }
        return 0;
      });

      const expectedReward = 8; // 2 residents × 4 gold
      const actualReward = goldAfter - goldBefore;
      expect(actualReward).toBe(expectedReward);
    });
  });

  test.describe('Halo Animation Integration', () => {
    test('should start halo animation when timer starts', async ({ page }) => {
      // Assign resident to start timer
      const residentCard = page.locator('[data-testid="pg-card"]').first();
      const rackSlot = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]').first();
      
      await dragElement(page, residentCard, rackSlot);
      await page.waitForTimeout(1000);

      // Check for POI element and animations
      const poiElement = page.locator('[data-poi]');
      await expect(poiElement).toBeVisible();

      // Check for active animations
      const hasAnimation = await page.evaluate(() => {
        const poi = document.querySelector('[data-poi]');
        if (!poi) return false;
        
        const animations = poi.getAnimations();
        return animations.length > 0;
      });

      expect(hasAnimation).toBe(true);
    });

    test('should stop halo animation when completed', async ({ page }) => {
      // Assign and complete
      const residentCard = page.locator('[data-testid="pg-card"]').first();
      const rackSlot = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]').first();
      
      await dragElement(page, residentCard, rackSlot);
      await page.waitForTimeout(1000);

      // Wait for completion
      await page.waitForFunction(() => {
        const poiData = window.poiCapsuleData;
        return poiData && poiData.status === 'completed';
      }, undefined, { timeout: 70_000 });

      // Check animation state
      const animationState = await page.evaluate(() => {
        const poi = document.querySelector('[data-poi]');
        if (!poi) return 'not-found';
        
        const animations = poi.getAnimations();
        const hasActiveAnimations = animations.some(anim => anim.playState === 'running');
        return hasActiveAnimations ? 'running' : 'stopped';
      });

      expect(animationState).toBe('stopped');
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle assignment to full slots gracefully', async ({ page }) => {
      const residentCards = page.locator('[data-testid="pg-card"]');
      const rackSlots = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]');

      // Fill all available slots
      const maxSlots = await rackSlots.count();
      for (let i = 0; i < maxSlots; i++) {
        if (i < await residentCards.count()) {
          await dragElement(page, residentCards.nth(i), rackSlots.nth(i));
          await page.waitForTimeout(500);
        }
      }

      // Try to assign one more resident (should fail gracefully)
      if (await residentCards.count() > maxSlots) {
        const extraResident = residentCards.nth(maxSlots);
        const firstSlot = rackSlots.first();
        
        // This should either replace or be rejected - check system handles it
        await dragElement(page, extraResident, firstSlot);
        await page.waitForTimeout(1000);
        
        // System should still be functional
        const poiState = await page.evaluate(() => {
          const poiData = window.poiCapsuleData;
          return poiData ? poiData.status : 'error';
        });

        expect(['idle', 'in-progress', 'completed']).toContain(poiState);
      }
    });

    test('should handle rapid assignment/removal', async ({ page }) => {
      const residentCard = page.locator('[data-testid="pg-card"]').first();
      const rackSlot = page.locator('[data-testid^="slot-button-slot-lab-open-slot-"]').first();

      // Rapid assign/remove cycles
      for (let i = 0; i < 3; i++) {
        await dragElement(page, residentCard, rackSlot);
        await page.waitForTimeout(200);
        
        // Try to clear slot (if clear button available)
        const clearButton = rackSlot.locator('button[aria-label*="Clear"], button[title*="Clear"]');
        if (await clearButton.count() > 0) {
          await clearButton.first().click();
          await page.waitForTimeout(200);
        }
      }

      // System should still be responsive
      const poiState = await page.evaluate(() => {
        const poiData = window.poiCapsuleData;
        return poiData ? {
          status: poiData.status,
          canCollect: poiData.canCollect
        } : null;
      });

      expect(poiState).not.toBeNull();
      expect(poiState!.status).toBe('idle'); // Should be idle after rapid changes
    });
  });
});

// Helper function for drag and drop
async function dragElement(page: any, source: any, target: any) {
  await source.hover();
  await page.mouse.down();
  await target.hover();
  await page.mouse.up();
}

// Export for potential reuse
export { TEST_ROUTE, dragElement };
