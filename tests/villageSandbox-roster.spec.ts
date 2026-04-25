import { test, expect, type Page } from '@playwright/test';
import { navigateToVillageSandbox, TEST_RESIDENTS, autoEnableTestHooks } from './fixtures/villageSandbox';

const ROSTER_PANEL_SELECTOR = '[data-testid="resident-roster-panel"]';
const PG_CARD_SELECTOR = '[data-testid="pg-card"]';
const ROSTER_FEEDBACK_SELECTOR = '[data-testid="roster-feedback"]';
const PRIMARY_RESIDENT_ID = TEST_RESIDENTS[0]?.id ?? 'ws11-resident-1';
const INJURED_RESIDENTS: typeof TEST_RESIDENTS = TEST_RESIDENTS.map((resident, index) =>
  index === 0 ? { ...resident, status: 'injured' as const, isInjured: true } : resident,
);

async function seedDeterministicRoster(page: Page, customResidents = TEST_RESIDENTS) {
  await navigateToVillageSandbox(page);

  await page.evaluate((residents) => {
    window.__idleVillageTestHooks?.seedResidents?.(residents);
  }, customResidents);

  await expect(page.locator(ROSTER_PANEL_SELECTOR)).toBeVisible({ timeout: 20_000 });

  await page.waitForFunction(
    () => Boolean(window.__idleVillageTestHooks?.getManagedActivityHandles?.()?.jobActivityId),
    undefined,
    { timeout: 20_000 },
  );
}

test.beforeEach(async ({ page }) => {
  await autoEnableTestHooks(page);
});

test.describe('VillageSandbox roster accessibility (SWI 1)', () => {
  test('dragging a resident updates feedback text and aria status', async ({ page }) => {
    await seedDeterministicRoster(page);

    const rosterPanel = page.locator(ROSTER_PANEL_SELECTOR);
    const firstToken = page.locator(PG_CARD_SELECTOR).first();
    await expect(rosterPanel).toBeVisible();
    await expect(firstToken).toBeVisible();
    await expect(page.locator(PG_CARD_SELECTOR)).toHaveCount(TEST_RESIDENTS.length);

    const handles = await page.evaluate(() => window.__idleVillageTestHooks?.getManagedActivityHandles?.());
    const jobActivityId = handles?.jobActivityId;
    expect(jobActivityId, 'job activity id should be exposed by test hooks').toBeTruthy();

    await test.step('simulate drag/drop via assignResident test hook', async () => {
      await page.evaluate(
        ({ activityId, residentId }) => {
          const hooks = window.__idleVillageTestHooks;
          hooks?.assignResidentToActivity?.(activityId, residentId);
        },
        { activityId: jobActivityId!, residentId: PRIMARY_RESIDENT_ID },
      );
    });

    const feedback = page.locator(ROSTER_FEEDBACK_SELECTOR);
    await expect(feedback).toBeVisible({ timeout: 5_000 });
    await expect(feedback).toHaveText(/(assegnato|impossibile assegnare)/i, { timeout: 5_000 });
    await expect(feedback).toHaveAttribute('role', 'status');
    await expect(feedback).toHaveAttribute('aria-live', 'polite');
    await expect(feedback).toHaveAttribute('aria-atomic', 'true');

    // Roster remains accessible after the simulated drag.
    await expect(rosterPanel).toBeVisible();
    await expect(firstToken).toBeVisible();
  });

  test('dragging an injured resident surfaces impossibile feedback', async ({ page }) => {
    await seedDeterministicRoster(page, INJURED_RESIDENTS);

    const rosterPanel = page.locator(ROSTER_PANEL_SELECTOR);
    const firstToken = page.locator(PG_CARD_SELECTOR).first();
    await expect(rosterPanel).toBeVisible();
    await expect(firstToken).toBeVisible();
    await expect(page.locator(PG_CARD_SELECTOR)).toHaveCount(INJURED_RESIDENTS.length);

    const handles = await page.evaluate(() => window.__idleVillageTestHooks?.getManagedActivityHandles?.());
    const jobActivityId = handles?.jobActivityId;
    expect(jobActivityId, 'job activity id should be exposed by test hooks').toBeTruthy();

    await test.step('attempt assignment with injured resident', async () => {
      await page.evaluate(
        ({ activityId, residentId }) => {
          const hooks = window.__idleVillageTestHooks;
          hooks?.assignResidentToActivity?.(activityId, residentId);
        },
        { activityId: jobActivityId!, residentId: PRIMARY_RESIDENT_ID },
      );
    });

    const feedback = page.locator(ROSTER_FEEDBACK_SELECTOR);
    await expect(feedback).toBeVisible({ timeout: 5_000 });
    await expect(feedback).toContainText(/impossibile assegnare/i, { timeout: 5_000 });
    await expect(feedback).toHaveAttribute('role', 'status');
    await expect(feedback).toHaveAttribute('aria-live', 'polite');
    await expect(feedback).toHaveAttribute('aria-atomic', 'true');
    await expect(rosterPanel).toBeVisible();
    await expect(firstToken).toBeVisible();
  });
});
