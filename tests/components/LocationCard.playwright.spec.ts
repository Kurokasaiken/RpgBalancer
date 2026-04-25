import { test, expect } from '@playwright/test';
import {
  navigateToVillageSandbox,
  seedVillageSandbox,
  getLocationSlotIds,
  resolveResidentForActivity,
  setDraggingResidentId,
  getLocationDropState,
} from '../fixtures/villageSandbox';

const LOCATION_CARD_SELECTOR = '[data-testid="map-board-shell"] [data-testid="location-card"]';

test.describe('LocationCard component drag feedback', () => {
  test('exposes bloom + data attribute toggles for valid drag', async ({ page }) => {
    await navigateToVillageSandbox(page);
    await seedVillageSandbox(page);

    const [primaryLocationId] = await getLocationSlotIds(page);
    expect(primaryLocationId).toBeTruthy();

    const locationCard = page.locator(LOCATION_CARD_SELECTOR);
    await expect(locationCard).toBeVisible();

    const compatibleResidentId = await resolveResidentForActivity(page, primaryLocationId, {
      shouldMatchRequirement: true,
    });

    await setDraggingResidentId(page, compatibleResidentId);
    await expect.poll(async () => getLocationDropState(page), { timeout: 5000 }).toBe('valid');

    await expect(locationCard).toHaveAttribute('data-state', 'valid');
    await expect(locationCard).toHaveAttribute('data-bloom-visible', 'true');

    // Clear drag state to simulate drop completion
    await setDraggingResidentId(page, null);
    await expect.poll(async () => getLocationDropState(page), { timeout: 5000 }).toBe('idle');

    await expect(locationCard).toHaveAttribute('data-bloom-visible', 'false');
    await expect(locationCard).toHaveAttribute('data-state', 'idle');
  });

  test('flags invalid drop attempts through data attributes', async ({ page }) => {
    await navigateToVillageSandbox(page);
    await seedVillageSandbox(page);

    const [primaryLocationId] = await getLocationSlotIds(page);
    expect(primaryLocationId).toBeTruthy();

    const locationCard = page.locator(LOCATION_CARD_SELECTOR);
    await expect(locationCard).toBeVisible();

    // Find a resident incompatible with ALL location slots
    const incompatibleResidentId = await page.evaluate(() => {
      const hooks = window.__idleVillageTestHooks;
      const roster = hooks?.getResidentRosterSnapshot?.() ?? [];
      const slotIds = hooks?.getLocationSlotIds?.() ?? [];
      
      // Find a resident that doesn't match ANY slot requirement
      for (const resident of roster.filter(r => r.status === 'available')) {
        const tags = new Set(resident.statTags ?? []);
        let isIncompatibleWithAll = true;
        
        for (const slotId of slotIds) {
          const activity = hooks?.getActivityDefinition?.(slotId);
          const req = activity?.statRequirement;
          
          if (!req) {
            isIncompatibleWithAll = false;
            break;
          }
          
          // Check if resident matches this slot
          const hasAllOf = (req.allOf ?? []).every(tag => tags.has(tag));
          const hasAnyOf = !req.anyOf || req.anyOf.length === 0 || req.anyOf.some(tag => tags.has(tag));
          const hasNoneOf = (req.noneOf ?? []).some(tag => tags.has(tag));
          
          if (hasAllOf && hasAnyOf && !hasNoneOf) {
            isIncompatibleWithAll = false;
            break;
          }
        }
        
        if (isIncompatibleWithAll) {
          return resident.id;
        }
      }
      
      return null;
    });
    
    // Skip test if no fully incompatible resident is available
    if (!incompatibleResidentId) {
      console.log('[LocationCard Test] No resident incompatible with ALL slots - skipping test');
      test.skip();
      return;
    }

    await setDraggingResidentId(page, incompatibleResidentId);
    await expect.poll(async () => getLocationDropState(page), { timeout: 5000 }).toBe('invalid');

    await expect(locationCard).toHaveAttribute('data-state', 'invalid');
    await expect(locationCard).toHaveAttribute('data-can-drop', 'false');
    await expect(locationCard).toHaveAttribute('data-bloom-visible', 'false');

    // Clear drag state to simulate drop completion
    await setDraggingResidentId(page, null);
    await expect.poll(async () => getLocationDropState(page), { timeout: 5000 }).toBe('idle');

    await expect(locationCard).toHaveAttribute('data-state', 'idle');
  });
});
