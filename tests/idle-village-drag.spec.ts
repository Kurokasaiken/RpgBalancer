import { test, expect } from '@playwright/test';
import { seedVillageSandbox } from './fixtures/villageSandbox';

test.describe('Village Sandbox Interaction', () => {

  test.beforeEach(async ({ page }) => {
    await seedVillageSandbox(page);
  });

  test('should allow dragging a resident to an activity slot', async ({ page }) => {
    // 1. Wait for Roster to load
    // The roster header is inside a section, avoiding the nav button 'Roster' label
    await expect(page.locator('section').filter({ hasText: 'Roster' }).first()).toBeVisible({ timeout: 15000 });

    // 2. Find a resident card (using draggable attribute)
    const residentCard = page.locator('[draggable="true"]').first();
    await expect(residentCard).toBeVisible();

    // 3. Find a target slot
    // ActivitySlotCard renders a div with aria-label starting with "Activity slot"
    const targetSlot = page.locator('div[aria-label^="Activity slot"]').first();
    await expect(targetSlot).toBeVisible();

    // 4. Perform Drag & Drop
    await residentCard.dragTo(targetSlot);

    // 5. Verification
    // When active, the slot shows "remaining" in the aria-label or visible text
    // The previous text was likely "Duration: X"
    await expect(targetSlot).toContainText('remaining', { timeout: 10000 });
  });
});
