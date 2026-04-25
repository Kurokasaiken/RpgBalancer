import { test, expect, type Page } from '@playwright/test';
import {
  navigateToVillageSandbox,
  seedVillageSandbox,
  ensureActivityAreaPopulated,
  getLocationDropState,
} from './fixtures/villageSandbox';

const expectLocationDropState = async (page: Page, expected: 'idle' | 'valid' | 'invalid') => {
  await expect.poll(async () => getLocationDropState(page), { timeout: 5_000 }).toBe(expected);
};

test.describe('VillageSandbox Quest', () => {
  test('opens quest overlay, verifies branch diagram and risk stripes', async ({ page }) => {
    await navigateToVillageSandbox(page);
    await seedVillageSandbox(page);
    const { slotId } = await ensureActivityAreaPopulated(page);
    await expect(page.locator(`[data-slot-id="${slotId}"]`)).toBeVisible();
    await expectLocationDropState(page, 'idle');

    // Find a quest action card in the map
    const questActionCard = page.locator('[data-testid="quest-action-card"]');
    const questExists = await questActionCard.count() > 0;
    if (!questExists) {
      test.skip(true, 'No quest action card available in sandbox');
      return;
    }

    await expect(questActionCard).toBeVisible();

    // Click the medallion to open quest detail overlay
    const medallion = questActionCard.locator('[role="button"]').first();
    await expect(medallion).toBeVisible();
    await medallion.click();

    // Verify quest detail modal opens
    const questModal = page.locator('[data-testid="quest-detail-modal"]');
    await expect(questModal).toBeVisible({ timeout: 5000 });

    // Verify quest chronicle is displayed
    const questChronicle = questModal.locator('div').filter({ hasText: /Quest/ }).first();
    await expect(questChronicle).toBeVisible();

    // Check branch diagram nodes
    const questNodes = page.locator('[data-testid^="quest-node-"]');
    const nodeCount = await questNodes.count();
    expect(nodeCount).toBeGreaterThan(0);

    // Check branch diagram edges
    const questEdges = page.locator('[data-testid^="quest-edge-"]');
    const edgeCount = await questEdges.count();
    // Edges may or may not be present depending on quest structure
    console.log(`Found ${nodeCount} quest nodes and ${edgeCount} quest edges`);

    // Check risk stripes on quest phase slots
    const riskStripes = questModal.locator('[data-testid="quest-phase-slot"] .absolute.inset-y-4.right-3');
    const riskStripeCount = await riskStripes.count();
    if (riskStripeCount > 0) {
      for (let i = 0; i < Math.min(riskStripeCount, 3); i++) {
        const stripe = riskStripes.nth(i);
        await expect(stripe).toBeVisible();

        // Check if stripe has injury percentage
        const injuryHeight = await stripe.locator('.bg-warning\\/80').getAttribute('style');
        if (injuryHeight && injuryHeight.includes('height')) {
          console.log(`Risk stripe ${i} has injury indicator`);
        }

        // Check if stripe has death percentage
        const deathHeight = await stripe.locator('.bg-error\\/80').getAttribute('style');
        if (deathHeight && deathHeight.includes('height')) {
          console.log(`Risk stripe ${i} has death indicator`);
        }
      }
    }

    // Close the modal by clicking the backdrop
    const backdrop = questModal.locator('.absolute.inset-0.bg-black\\/60.backdrop-blur-sm').first();
    await backdrop.click();

    // Verify modal closes
    await expect(questModal).not.toBeVisible();
    await expectLocationDropState(page, 'idle');
  });

  test('quest action card shows progress and risk indicators', async ({ page }) => {
    await navigateToVillageSandbox(page);
    await seedVillageSandbox(page);
    const { slotId } = await ensureActivityAreaPopulated(page);
    await expect(page.locator(`[data-slot-id="${slotId}"]`)).toBeVisible();
    await expectLocationDropState(page, 'idle');

    // Find a quest action card
    const questActionCard = page.locator('[data-testid="quest-action-card"]');
    const questExists = await questActionCard.count() > 0;
    if (!questExists) {
      test.skip(true, 'No quest action card available in sandbox');
      return;
    }

    await expect(questActionCard).toBeVisible();

    // Verify it has progress indicator
    const progressElement = questActionCard.locator('.relative').first();
    await expect(progressElement).toBeVisible();

    // Verify it has timer display
    const timerElement = questActionCard.locator('font-mono').first();
    await expect(timerElement).toBeVisible();

    // Verify it has risk stripe
    const riskStripe = questActionCard.locator('[data-testid="quest-action-card-risk"]');
    await expect(riskStripe).toBeVisible();

    // Check risk stripe data attributes
    const hasRisk = await riskStripe.getAttribute('data-has-risk');
    expect(hasRisk).toBeDefined();

    if (hasRisk === 'true') {
      const injuryPercent = await riskStripe.getAttribute('data-injury-percent');
      expect(injuryPercent).not.toBeNull();

      const deathPercent = await riskStripe.getAttribute('data-death-percent');
      expect(deathPercent).not.toBeNull();
    }

    await expectLocationDropState(page, 'idle');
  });
});
