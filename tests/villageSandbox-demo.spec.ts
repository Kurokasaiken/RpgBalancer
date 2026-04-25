import { test, expect, type Page } from '@playwright/test';
import { seedVillageSandbox, resetVillageSandbox, invokeDemoHandler } from './fixtures/villageSandbox';

const DEMO_PANEL_SELECTOR = '[data-testid="demo-panel"]';
const DEMO_SLOT_GROUP_SELECTOR = '[data-testid="demo-slot-group"]';

async function bootstrapVillageSandbox(page: Page) {
  await seedVillageSandbox(page);
  // Documented usage: resetVillageSandbox guarantees deterministic baseline before each test.
  await resetVillageSandbox(page);
  await page.waitForSelector(DEMO_PANEL_SELECTOR, { timeout: 20000 });
}

test.describe('Village Sandbox Demo Panel (WS11)', () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapVillageSandbox(page);
  });

  test('sets requirement, expands plus slot, starts demo, and resets to baseline', async ({ page }) => {
    const demoPanel = page.locator(DEMO_PANEL_SELECTOR);
    await expect(demoPanel).toBeVisible();

    // Requirement controls (accessible locators)
    const hpRequirementButton = page.locator('[data-testid="demo-requirement-hp200"]');
    const noRequirementButton = page.locator('[data-testid="demo-requirement-none"]');
    await hpRequirementButton.click();
    await expect(hpRequirementButton).toHaveAttribute('aria-pressed', 'true');
    await expect(noRequirementButton).toHaveAttribute('aria-pressed', 'false');

    const slotGroup = page.locator(DEMO_SLOT_GROUP_SELECTOR);
    await expect(slotGroup.locator('[data-slot-kind="assignment"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="demo-slot-plus"]')).toBeVisible();

    await invokeDemoHandler(page, 'onSlotDrop', 'demo-slot-1', 'ws11-resident-1');
    await invokeDemoHandler(page, 'onSlotDrop', 'demo-plus-button', 'ws11-resident-2');

    const assignmentSlots = slotGroup.locator('[data-slot-kind="assignment"]');
    await expect(assignmentSlots).toHaveCount(2);
    await expect(assignmentSlots.nth(0)).toContainText('Slot 1');
    await expect(assignmentSlots.nth(1)).toContainText('Slot 2');

    const startButton = page.locator('[data-testid="demo-start-button"]');
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Starting the demo should surface assignment feedback in the sandbox UI.
    await expect(page.locator('text=Demo attività avviata!')).toBeVisible({ timeout: 5000 });

    // Use the shared fixture helper to reset Village Sandbox and assert baseline state restored.
    await resetVillageSandbox(page);
    await page.waitForSelector(DEMO_PANEL_SELECTOR, { timeout: 10000 });

    await invokeDemoHandler(page, 'onRemoveAll');
    const assignments = page.locator('[data-slot-kind="assignment"]');
    await expect(assignments).toHaveCount(1);
    await expect(assignments.first()).toContainText('Slot 1');
    await expect(startButton).toBeDisabled();
    await expect(page.locator('[data-testid="demo-slot-plus"]')).toBeVisible();
  });
});
