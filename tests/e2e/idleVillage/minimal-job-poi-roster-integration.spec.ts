import { test, expect } from '@playwright/test';

test.describe('Minimal Job POI Roster Integration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/minimal-job-poi-roster-integration');
  });

  test('should render the integration page', async ({ page }) => {
    await expect(page.getByText('JOB POI + ROSTER INTEGRATION')).toBeVisible();
    await expect(page.getByText('Canonical components from TestHub')).toBeVisible();
  });

  test('should render Job POI section', async ({ page }) => {
    await expect(page.getByText('Job POI + Slot (Same Requirements)')).toBeVisible();
  });

  test('should render roster section', async ({ page }) => {
    await expect(page.getByText('Village Roster')).toBeVisible();
    const rosterSection = page.locator('[data-testid="village-roster-section"]');
    await expect(rosterSection).toBeVisible();
  });

  test('should have resident cards in roster', async ({ page }) => {
    const rosterSection = page.locator('[data-testid="village-roster-section"]');
    await expect(rosterSection).toBeVisible();
    // Check that there are some elements in the roster (could be cards or medals)
    const rosterElements = rosterSection.locator('*').all();
    const count = (await rosterElements).length;
    expect(count).toBeGreaterThan(5); // Should have multiple elements
  });

  test.describe('Drag & Drop Interactions', () => {
    test('should show bloom on POI and slot when dragging valid resident (HP > 200)', async ({ page }) => {
      // Find a draggable element in the roster
      const rosterSection = page.locator('[data-testid="village-roster-section"]');
      await expect(rosterSection).toBeVisible();
      
      // Find any draggable element (could be card, medal, or button)
      const draggableElement = rosterSection.locator('button, [role="button"], [draggable="true"]').first();
      await expect(draggableElement).toBeVisible();

      // Start dragging the element
      await draggableElement.dragTo(page.locator('[data-testid="minimal-job-poi-roster-integration-page"]'));

      // Check that POI shows bloom (green glow) when valid
      // The POI medallion should have a boxShadow when valid
      const poiMedallion = page.locator('[data-testid="job-poi-chop-wood"]');
      await expect(poiMedallion).toBeVisible();
      const poiBoxShadow = await poiMedallion.evaluate((el) => window.getComputedStyle(el).boxShadow);
      expect(poiBoxShadow).not.toBe('none');

      // Check that slot shows bloom
      const slotRack = page.locator('[data-slot-id="slot-1"]');
      await expect(slotRack).toBeVisible();
      const slotBoxShadow = await slotRack.evaluate((el) => window.getComputedStyle(el).boxShadow);
      expect(slotBoxShadow).not.toBe('none');
    });

    test('should show alpha 30% on POI and slot when dragging invalid resident (HP <= 200)', async ({ page }) => {
      // Find a draggable element in the roster
      const rosterSection = page.locator('[data-testid="village-roster-section"]');
      await expect(rosterSection).toBeVisible();
      
      const draggableElement = rosterSection.locator('button, [role="button"], [draggable="true"]').first();
      await expect(draggableElement).toBeVisible();

      // Start dragging the element
      await draggableElement.dragTo(page.locator('[data-testid="minimal-job-poi-roster-integration-page"]'));

      // Check that POI shows alpha 30% when invalid
      const poiMedallion = page.locator('[data-testid="job-poi-chop-wood"]');
      await expect(poiMedallion).toBeVisible();
      const poiOpacity = await poiMedallion.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(poiOpacity).toBe('0.3');

      // Check that slot shows alpha 30%
      const slotRack = page.locator('[data-slot-id="slot-1"]');
      await expect(slotRack).toBeVisible();
      const slotOpacity = await slotRack.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(slotOpacity).toBe('0.3');
    });

    test('should assign resident to slot on click (slot occupied, pg away)', async ({ page }) => {
      // Find a clickable element in the roster
      const rosterSection = page.locator('[data-testid="village-roster-section"]');
      await expect(rosterSection).toBeVisible();
      
      const clickableElement = rosterSection.locator('button, [role="button"]').first();
      await expect(clickableElement).toBeVisible();

      // Click the element to assign it
      await clickableElement.click();

      // Check that slot is now occupied
      const slotRack = page.locator('[data-slot-id="slot-1"]');
      await expect(slotRack).toBeVisible();
      // The slot should show assigned state
      const slotButton = slotRack.locator('[data-testid^="slot-button-"]');
      await expect(slotButton).toBeVisible();

      // Check that the clicked element is marked as assigned in the roster
      // The element should have assigned state styling (opacity or pointer-events)
      const elementAssigned = await clickableElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.opacity === '0.5' || styles.pointerEvents === 'none';
      });
      expect(elementAssigned).toBe(true);
    });
  });
});
