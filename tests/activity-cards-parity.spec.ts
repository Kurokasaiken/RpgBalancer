import { test, expect } from '@playwright/test';
import { seedVillageSandbox, seedPunchClubResidents, dragResidentCard } from '../tests/fixtures/villageSandbox';

const JOB_SLOT_ID = 'job_punch_training';
const JOB_SLOT_TEST_ID = `activity-slot-${JOB_SLOT_ID}`;

test('Activity Cards Parity Capture', async ({ page }) => {
  await seedVillageSandbox(page, { tabId: 'punchClub' });

  // Wait for layout
  await page.waitForSelector('[data-testid="village-sandbox-layout"]', { timeout: 20000 });

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

  const activityAreaLocator = page.locator('[data-testid="village-sandbox-layout"]').first();
  await activityAreaLocator.waitFor();

  const harnessLocator = page.locator('[data-testid="action-detail-harness"]');
  await harnessLocator.waitFor({ timeout: 20000 });

  // Valid drop simulation
  await dragResidentCard(page, `[data-testid="resident-${compatible.id}"]`, `[data-testid="${JOB_SLOT_TEST_ID}"]`);
  await expect(page.locator(`[data-testid="${JOB_SLOT_TEST_ID}"]`)).toBeVisible({ timeout: 20000 });

  // Diagnostics for slotDropStates
  await page.evaluate(() => {
    const slotDropStates = window.__idleVillageTestHooks?.getSlotDropStates?.() ?? {};
    console.log('[drag simulation] slotDropStates after valid drag:', JSON.stringify(slotDropStates));
  });

  // Wait for visual states: bloom for valid
  await page.waitForFunction(() => {
    const harness = document.querySelector('[data-testid="action-detail-harness"]');
    if (!harness) return false;
    const hasBloom = harness.querySelector('.bloom') !== null;
    return hasBloom;
  }, { timeout: 2000 }).catch(() => console.log('Bloom not detected within timeout for valid drop'));

  const boxValid = await activityAreaLocator.boundingBox();
  if (boxValid) {
    await page.screenshot({ path: 'docs/ui_regressions/activity-cards-valid.png', clip: boxValid });
  }

  // Idle
  await page.evaluate(() => window.__idleVillageTestHooks?.setDraggingResidentId?.(null));
  await page.waitForTimeout(500);
  const boxIdle = await activityAreaLocator.boundingBox();
  if (boxIdle) {
    await page.screenshot({ path: 'docs/ui_regressions/activity-cards-idle.png', clip: boxIdle });
  }

  // Invalid drop simulation
  await dragResidentCard(page, `[data-testid="resident-${incompatible.id}"]`, `[data-testid="${JOB_SLOT_TEST_ID}"]`);
  await expect(page.locator(`[data-testid="${JOB_SLOT_TEST_ID}"]`)).toBeVisible({ timeout: 20000 });

  // Diagnostics for invalid
  await page.evaluate(() => {
    const slotDropStates = window.__idleVillageTestHooks?.getSlotDropStates?.() ?? {};
    console.log('[drag simulation] slotDropStates after invalid drag:', JSON.stringify(slotDropStates));
  });

  // Wait for visual states: opacity for invalid
  await page.waitForFunction(() => {
    const harness = document.querySelector('[data-testid="action-detail-harness"]');
    if (!harness) return false;
    const hasOpacity = harness.style.opacity !== '' && parseFloat(harness.style.opacity) < 1;
    return hasOpacity;
  }, { timeout: 2000 }).catch(() => console.log('Opacity not detected within timeout for invalid drop'));

  const boxInvalid = await activityAreaLocator.boundingBox();
  if (boxInvalid) {
    await page.screenshot({ path: 'docs/ui_regressions/activity-cards-invalid.png', clip: boxInvalid });
  }
});
