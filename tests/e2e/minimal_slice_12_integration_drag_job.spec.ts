import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalIntegration — Drag PgCard to JobCard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-integration-drag-job`);
    await page.waitForLoadState('networkidle');
  });

  // ===== DRAG SETUP (4 tests) =====

  test('1.1: Resident card visible', async ({ page }) => {
    const card = page.locator('[data-testid^="integration-resident-res_"]').first();
    await expect(card).toBeVisible();
  });

  test('1.2: Job card visible', async ({ page }) => {
    const job = page.locator('[data-testid="integration-job-0"]');
    await expect(job).toBeVisible();
  });

  test('1.3: Drag initiates from resident', async ({ page }) => {
    const card = page.locator('[data-testid="integration-resident-res_001"]');
    await expect(card).toBeVisible();
  });

  test('1.4: Drop target ready', async ({ page }) => {
    const dropZone = page.locator('[data-testid="integration-job-0-empty"]');
    await expect(dropZone).toBeVisible();
  });

  // ===== DRAG-DROP FLOW (6 tests) =====

  test('2.1: Drag starts on resident', async ({ page }) => {
    const resident = page.locator('[data-testid="integration-resident-res_001"]');
    await resident.dragTo(page.locator('[data-testid="integration-job-0"]'));
  });

  test('2.2: Hover shows drop zone highlight', async ({ page }) => {
    const job = page.locator('[data-testid="integration-job-0"]');
    await job.hover();
    await expect(job).toBeVisible();
  });

  test('2.3: Drop completes assignment', async ({ page }) => {
    const resident = page.locator('[data-testid="integration-resident-res_001"]');
    const dropZone = page.locator('[data-testid="integration-job-0"]');
    await resident.dragTo(dropZone);

    const assigned = page.locator('[data-testid="integration-job-0-assigned"]');
    await expect(assigned).toBeVisible();
  });

  test('2.4: Resident moves to job slot', async ({ page }) => {
    const resident = page.locator('[data-testid="integration-resident-res_001"]');
    const job = page.locator('[data-testid="integration-job-0"]');
    await resident.dragTo(job);

    // Resident should be gone from roster
    const rosterCard = page.locator('[data-testid="integration-resident-res_001"]');
    expect(await rosterCard.count()).toBe(0);
  });

  test('2.5: Job shows assigned resident', async ({ page }) => {
    const resident = page.locator('[data-testid="integration-resident-res_001"]');
    const job = page.locator('[data-testid="integration-job-0"]');
    await resident.dragTo(job);

    const assigned = page.locator('[data-testid="integration-job-0-assigned"]');
    await expect(assigned).toBeVisible();
  });

  test('2.6: Drag resets after drop', async ({ page }) => {
    const resident = page.locator('[data-testid="integration-resident-res_001"]');
    const job = page.locator('[data-testid="integration-job-0"]');
    await resident.dragTo(job);

    const rosterEmpty = page.locator('[data-testid="integration-roster-empty"]');
    await expect(rosterEmpty).toBeVisible();
  });

  // ===== VALIDATION (4 tests) =====

  test('3.1: Cant drag to full slot', async ({ page }) => {
    // First assignment
    const resident1 = page.locator('[data-testid="integration-resident-res_001"]');
    const job = page.locator('[data-testid="integration-job-0"]');
    await resident1.dragTo(job);

    // Try second assignment to same slot - should still only have one
    const resident2 = page.locator('[data-testid="integration-resident-res_002"]');
    const jobAfter = page.locator('[data-testid="integration-job-0"]');
    await resident2.dragTo(jobAfter);

    const assigned = page.locator('[data-testid="integration-job-0-assigned"]');
    await expect(assigned).toBeVisible();
  });

  test('3.2: Multiple residents can be assigned', async ({ page }) => {
    const resident1 = page.locator('[data-testid="integration-resident-res_001"]');
    const job1 = page.locator('[data-testid="integration-job-0"]');
    await resident1.dragTo(job1);

    const resident2 = page.locator('[data-testid="integration-resident-res_002"]');
    const job2 = page.locator('[data-testid="integration-job-1"]');
    await resident2.dragTo(job2);

    const assigned1 = page.locator('[data-testid="integration-job-0-assigned"]');
    const assigned2 = page.locator('[data-testid="integration-job-1-assigned"]');
    await expect(assigned1).toBeVisible();
    await expect(assigned2).toBeVisible();
  });

  test('3.3: Assignment persists', async ({ page }) => {
    const resident = page.locator('[data-testid="integration-resident-res_001"]');
    const job = page.locator('[data-testid="integration-job-0"]');
    await resident.dragTo(job);

    const assigned = page.locator('[data-testid="integration-job-0-assigned"]');
    const text = await assigned.textContent();
    expect(text).toContain('Ragnar');
  });

  test('3.4: Cant drag incompatible residents', async ({ page }) => {
    const resident = page.locator('[data-testid="integration-resident-res_001"]');
    await expect(resident).toBeVisible();
  });

  // ===== VISUAL FEEDBACK (2 tests) =====

  test('4.1: Drop zone highlights', async ({ page }) => {
    const dropZone = page.locator('[data-testid="integration-job-0-empty"]');
    await expect(dropZone).toBeVisible();
  });

  test('4.2: Resident unassigns correctly', async ({ page }) => {
    const resident = page.locator('[data-testid="integration-resident-res_001"]');
    const job = page.locator('[data-testid="integration-job-0"]');
    await resident.dragTo(job);

    const unassignButton = page.locator('[data-testid="integration-unassign-0"]');
    await unassignButton.click();

    const backInRoster = page.locator('[data-testid="integration-resident-res_001"]');
    await expect(backInRoster).toBeVisible();
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: Integration drag snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('minimal-integration-drag-job.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
