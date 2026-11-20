import { test, expect, type Page } from '@playwright/test';
import { seedVillageSandbox, resetVillageSandbox } from './fixtures/villageSandbox';

const MAP_TAB_SELECTOR = '[data-testid="nav-btn-map"]';
const LOCATION_BUTTON_LABEL = /Foresta/i;
const ASSIGNMENT_TOAST_REGEX = /ha iniziato/i;
const RESET_TOAST_REGEX = /Sandbox resettato/i;

async function ensureMapReady(page: Page) {
  const navButton = page.locator(MAP_TAB_SELECTOR).first();
  await expect(navButton).toBeVisible({ timeout: 15000 });
  await navButton.click();
  await expect(page.getByText('Village Sandbox')).toBeVisible({ timeout: 15000 });
}

async function openLocationDetail(page: Page) {
  const leftColumn = page.getByTestId('village-sandbox-left-column');
  const locationButton = leftColumn.getByRole('button', { name: LOCATION_BUTTON_LABEL });
  await expect(locationButton).toBeVisible({ timeout: 15000 });
  await locationButton.click();
  await expect(page.getByText('Foresta')).toBeVisible({ timeout: 5000 });
}

async function assignResident(page: Page, activityId: string, residentId: string) {
  await page.evaluate(
    ({ activityId, residentId }) => {
      const hooks = window.__idleVillageTestHooks as {
        assignResidentToActivity?: (activityId: string, residentId: string) => void;
      };
      hooks?.assignResidentToActivity?.(activityId, residentId);
    },
    { activityId, residentId },
  );
}

test.describe('VillageSandbox Location Detail', () => {
  test.beforeEach(async ({ page }) => {
    await seedVillageSandbox(page);
    await resetVillageSandbox(page);
  });

  test('opens location detail, assigns resident, verifies reset feedback', async ({ page }) => {
    await ensureMapReady(page);
    await openLocationDetail(page);

    await assignResident(page, 'job-woodcutting', 'ws11-resident-1');
    await expect(page.getByText(ASSIGNMENT_TOAST_REGEX)).toBeVisible({ timeout: 5000 });

    await page.evaluate(() => {
      window.__idleVillageTestHooks?.invokeDemoHandler?.('onRemoveAll');
    });
    await expect(page.getByText(RESET_TOAST_REGEX)).toBeVisible({ timeout: 5000 });

    const closeButton = page.getByRole('button', { name: /chiudi location detail/i });
    await closeButton.click();
    await expect(page.getByText('Foresta')).not.toBeVisible({ timeout: 5000 });
  });
});
