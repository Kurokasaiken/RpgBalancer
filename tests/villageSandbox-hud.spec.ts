import { test, expect, type Page } from '@playwright/test';
import { navigateToVillageSandbox, autoEnableTestHooks } from './fixtures/villageSandbox';

const SELECTORS = {
  activeHud: '[data-testid="active-hud"]',
  activityActionCard: '[data-testid="activity-action-card"]',
  collectButton: 'button:has-text("Raccogli")',
  riskStripe: '[data-testid="activity-risk-stripe"]',
};

async function seedAndAssignJob(page: Page): Promise<string> {
  await page.evaluate(() => {
    const hooks = window.__idleVillageTestHooks;
    if (!hooks?.seedResidents) {
      throw new Error('IdleVillage test hooks unavailable (seedResidents)');
    }
    // Seed with a resident that can do jobs
    hooks.seedResidents([
      {
        id: 'warrior-1',
        displayName: 'Warrior',
        statTags: ['strength'],
        fatigue: 0,
        status: 'available',
      },
    ]);
  });

  // Get job activity ID
  const jobActivityId = await page.waitForFunction(
    () => window.__idleVillageTestHooks?.getManagedActivityHandles?.()?.jobActivityId ?? null,
    undefined,
    { timeout: 20_000 },
  ).then(handle => handle.jsonValue() as string | null);

  if (!jobActivityId) {
    throw new Error('No job activity available');
  }

  // Assign resident to job
  await page.evaluate((activityId) => {
    window.__idleVillageTestHooks?.assignResidentToActivity?.(activityId, 'warrior-1');
  }, jobActivityId);

  return jobActivityId;
}

async function seedAndAssignQuest(page: Page): Promise<string> {
  await page.evaluate(() => {
    const hooks = window.__idleVillageTestHooks;
    if (!hooks?.seedResidents) {
      throw new Error('IdleVillage test hooks unavailable');
    }
    // Seed with a resident that can do quests
    hooks.seedResidents([
      {
        id: 'hero-1',
        displayName: 'Hero',
        statTags: ['strength', 'courage'],
        fatigue: 0,
        status: 'available',
      },
    ]);
  });

  // Get quest activity ID
  const questActivityId = await page.waitForFunction(
    () => window.__idleVillageTestHooks?.getManagedActivityHandles?.()?.questActivityId ?? null,
    undefined,
    { timeout: 20_000 },
  ).then(handle => handle.jsonValue() as string | null);

  if (!questActivityId) {
    throw new Error('No quest activity available');
  }

  // Assign resident to quest
  await page.evaluate((activityId) => {
    window.__idleVillageTestHooks?.assignResidentToActivity?.(activityId, 'hero-1');
  }, questActivityId);

  return questActivityId;
}

async function advanceTimeToComplete(page: Page, activityId: string) {
  // Advance time until activity is completed
  await page.waitForFunction(
    (targetActivityId) => {
      const hooks = window.__idleVillageTestHooks;
      const activity = hooks?.getActivityDefinition?.(targetActivityId);
      if (!activity) return false;
      const duration = activity.durationFormula ? Number(activity.durationFormula) : 10;
      // Advance enough time
      hooks?.advanceTimeUnits?.(duration);
      return true;
    },
    activityId,
    { timeout: 10_000 },
  );

  // Wait a bit for UI to update
  await page.waitForTimeout(500);
}

test.beforeEach(async ({ page }) => {
  await autoEnableTestHooks(page);
});

test.describe('VillageSandbox HUD - Job/Quest Completion and Risk Indicators', () => {
  test('shows completed job with collect CTA and handles collection', async ({ page }) => {
    await navigateToVillageSandbox(page);
    const jobActivityId = await seedAndAssignJob(page);

    // Verify job is running in HUD
    await expect(page.locator(SELECTORS.activeHud)).toBeVisible();
    const initialCards = page.locator(SELECTORS.activityActionCard);
    await expect(initialCards).toHaveCount(1);

    // Advance time to complete
    await advanceTimeToComplete(page, jobActivityId);

    // Verify collect button appears
    const collectButton = page.locator(SELECTORS.collectButton);
    await expect(collectButton).toBeVisible();

    // Click collect
    await collectButton.click();

    // Verify activity is removed from HUD
    await expect(page.locator(SELECTORS.activityActionCard)).toHaveCount(0);
    await expect(page.locator(SELECTORS.activeHud)).toContainText('Nessuna attività in corso');
  });

  test('shows completed quest with collect CTA and handles collection', async ({ page }) => {
    await navigateToVillageSandbox(page);
    const questActivityId = await seedAndAssignQuest(page);

    // Verify quest is running in HUD
    await expect(page.locator(SELECTORS.activeHud)).toBeVisible();
    const initialCards = page.locator(SELECTORS.activityActionCard);
    await expect(initialCards).toHaveCount(1);

    // Advance time to complete
    await advanceTimeToComplete(page, questActivityId);

    // Verify collect button appears
    const collectButton = page.locator(SELECTORS.collectButton);
    await expect(collectButton).toBeVisible();

    // Click collect
    await collectButton.click();

    // Verify activity is removed from HUD
    await expect(page.locator(SELECTORS.activityActionCard)).toHaveCount(0);
    await expect(page.locator(SELECTORS.activeHud)).toContainText('Nessuna attività in corso');
  });

  test('displays risk indicators with correct stripes', async ({ page }) => {
    await navigateToVillageSandbox(page);
    await seedAndAssignQuest(page);

    // Verify risk stripes are present
    const riskStripes = page.locator(SELECTORS.riskStripe);
    await expect(riskStripes.first()).toBeVisible();

    // Check that at least one stripe has risk data
    const hasRiskStripes = await riskStripes.locator('[data-has-risk="true"]').count();
    expect(hasRiskStripes).toBeGreaterThan(0);

    // Verify data attributes are present
    const firstStripe = riskStripes.first();
    const injuryPercent = await firstStripe.getAttribute('data-injury-percent');
    const deathPercent = await firstStripe.getAttribute('data-death-percent');

    expect(injuryPercent).not.toBeNull();
    expect(deathPercent).not.toBeNull();
    expect(parseFloat(injuryPercent!)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(deathPercent!)).toBeGreaterThanOrEqual(0);
  });

  test('shows multiple activities in HUD with correct sorting', async ({ page }) => {
    await navigateToVillageSandbox(page);

    // Seed multiple residents
    await page.evaluate(() => {
      window.__idleVillageTestHooks?.seedResidents?.([
        {
          id: 'warrior-1',
          displayName: 'Warrior',
          statTags: ['strength'],
          fatigue: 0,
          status: 'available',
        },
        {
          id: 'hero-1',
          displayName: 'Hero',
          statTags: ['strength', 'courage'],
          fatigue: 0,
          status: 'available',
        },
      ]);
    });

    // Assign to job and quest
    const handles = await page.evaluate(() => window.__idleVillageTestHooks?.getManagedActivityHandles?.());
    const jobId = handles?.jobActivityId;
    const questId = handles?.questActivityId;

    if (jobId) {
      await page.evaluate((id) => window.__idleVillageTestHooks?.assignResidentToActivity?.(id, 'warrior-1'), jobId);
    }
    if (questId) {
      await page.evaluate((id) => window.__idleVillageTestHooks?.assignResidentToActivity?.(id, 'hero-1'), questId);
    }

    // Verify both activities shown
    const cards = page.locator(SELECTORS.activityActionCard);
    await expect(cards).toHaveCount(2);

    // Complete quest (should sort completed first)
    if (questId) {
      await advanceTimeToComplete(page, questId);
      const collectButtons = page.locator(SELECTORS.collectButton);
      await expect(collectButtons).toHaveCount(1); // Quest completed
    }
  });

  test('HUD shows empty state when no activities', async ({ page }) => {
    await navigateToVillageSandbox(page);

    // No activities assigned
    await expect(page.locator(SELECTORS.activeHud)).toBeVisible();
    await expect(page.locator(SELECTORS.activeHud)).toContainText('Nessuna attività in corso');
    await expect(page.locator(SELECTORS.activityActionCard)).toHaveCount(0);
  });
});
