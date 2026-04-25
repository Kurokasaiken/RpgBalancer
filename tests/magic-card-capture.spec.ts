import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { enableTestHooks, seedPunchClubResidents, dragResidentCard } from '../tests/fixtures/villageSandbox';

const SCREENSHOT_DIR = 'docs/ui_regressions';
const JOB_SLOT_ID = 'job_punch_training';
const JOB_SLOT_TEST_ID = `activity-slot-${JOB_SLOT_ID}`;

const waitForDropState = async (page: Page, expected: 'idle' | 'valid' | 'invalid') => {
  await expect
    .poll(
      async () =>
        page.evaluate(
          () => window.__idleVillageTestHooks?.getActionDetailHarnessState?.()?.dropState ?? 'unknown',
        ),
      { timeout: 20000 },
    )
    .toBe(expected);
};

const setDraggingResident = async (page: Page, residentId: string | null) => {
  await page.evaluate((id) => window.__idleVillageTestHooks?.setDraggingResidentId?.(id), residentId);
};

const captureActivityCard = async (locator: Locator, stateName: string) => {
  const filePath = path.join(SCREENSHOT_DIR, `activity-cards-${stateName}.png`);
  await locator.screenshot({ path: filePath });
};

test('Magic Card Capture', async ({ page }) => {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await enableTestHooks(page, 'punch_club_light');
  page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('/');

  await page.waitForSelector('[data-testid="village-sandbox-layout"]', {
    timeout: 20000,
    state: 'visible',
  });

  // Wait for hooks
  await page.waitForFunction(() => window.__idleVillageTestHooks, { timeout: 20000 });

  // Seed residents
  await seedPunchClubResidents(page);

  // Get roster
  const roster = await page.evaluate(() => window.__idleVillageTestHooks?.getResidentRosterSnapshot?.() ?? []);
  const compatible = roster.find(r => r.statTags?.includes('punch_gym'));
  const incompatible = roster.find(r => !r.statTags?.includes('punch_gym'));

  if (!compatible) {
    console.log('No compatible resident found');
    console.log('Roster:', roster);
    return;
  }

  if (!incompatible) {
    console.log('No incompatible resident found');
    console.log('Roster:', roster);
    return;
  }

  const harnessLocator = page.locator('[data-testid="action-detail-harness"]');
  await harnessLocator.waitFor({ timeout: 20000 });

  const activityCard = page.locator(`[data-testid="${JOB_SLOT_TEST_ID}"]`).first();
  await dragResidentCard(page, `[data-testid="resident-${compatible.id}"]`, `[data-testid="${JOB_SLOT_TEST_ID}"]`);
  await expect(activityCard).toBeVisible({ timeout: 20000 });

  // Idle
  await setDraggingResident(page, null);
  await waitForDropState(page, 'idle');
  const idleState = await page.evaluate(() => window.__idleVillageTestHooks?.getActionDetailHarnessState?.());
  console.log('Idle state:', JSON.stringify(idleState, null, 2));
  await captureActivityCard(activityCard, 'idle');

  // Valid
  await setDraggingResident(page, compatible.id);
  await page.waitForTimeout(500);
  const validState = await page.evaluate(() => window.__idleVillageTestHooks?.getActionDetailHarnessState?.());
  console.log('Valid state:', JSON.stringify(validState, null, 2));
  await captureActivityCard(activityCard, 'valid');

  // Invalid
  await setDraggingResident(page, incompatible.id);
  await page.waitForTimeout(500);
  const invalidState = await page.evaluate(() => window.__idleVillageTestHooks?.getActionDetailHarnessState?.());
  console.log('Invalid state:', JSON.stringify(invalidState, null, 2));
  await captureActivityCard(activityCard, 'invalid');
});

