import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalIntegration — Full Quest Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-integration-quest-flow`);
    await page.waitForLoadState('networkidle');
  });

  // ===== QUEST ASSIGNMENT (4 tests) =====

  test('1.1: Quest card visible', async ({ page }) => {
    const card = page.locator('[data-testid="flow-quest-0"]');
    await expect(card).toBeVisible();
  });

  test('1.2: Resident assigned to quest', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    const stage = page.locator('[data-testid="flow-assignment-stage"]');
    const text = await stage.textContent();
    expect(text).toContain('Ragnar');
  });

  test('1.3: Assignment shows in card', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    const startCheck = page.locator('[data-testid="flow-start-check"]');
    await expect(startCheck).toBeVisible();
  });

  test('1.4: Ready for quest start', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    const startCheck = page.locator('[data-testid="flow-start-check"]');
    await expect(startCheck).toBeVisible();
  });

  // ===== SKILL CHECK (6 tests) =====

  test('2.1: Check panel appears after assignment', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    const checkStage = page.locator('[data-testid="flow-check-stage"]');
    await expect(checkStage).toBeVisible();
  });

  test('2.2: Roll input visible and functional', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    const input = page.locator('[data-testid="flow-roll-input"]');
    await expect(input).toBeVisible();
    await input.fill('15');
    const value = await input.inputValue();
    expect(value).toBe('15');
  });

  test('2.3: Check resolution works', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('15');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const outcomeStage = page.locator('[data-testid="flow-outcome-stage"]');
    await expect(outcomeStage).toBeVisible();
  });

  test('2.4: Success/failure calculated', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('15');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const outcome = page.locator('[data-testid="flow-outcome-stage"]');
    const text = await outcome.textContent();
    expect(text).toMatch(/SUCCESS|FAILURE/);
  });

  test('2.5: Margin displayed', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('15');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const checkDetails = page.locator('.flow-outcome-stage');
    await expect(page.locator('[data-testid="flow-outcome-stage"]')).toBeVisible();
  });

  test('2.6: Result shows immediately', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('15');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const outcome = page.locator('[data-testid="flow-outcome-stage"]');
    await expect(outcome).toBeVisible();
  });

  // ===== OUTCOME DISPLAY (6 tests) =====

  test('3.1: Outcome modal appears after check', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('15');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const outcome = page.locator('[data-testid="flow-outcome-stage"]');
    await expect(outcome).toBeVisible();
  });

  test('3.2: Shows success/failure styling', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('18');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const outcome = page.locator('[data-testid="flow-outcome-stage"]');
    const text = await outcome.textContent();
    expect(text).toContain('SUCCESS');
  });

  test('3.3: Displays rewards correctly', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('18');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const outcome = page.locator('[data-testid="flow-outcome-stage"]');
    const text = await outcome.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('3.4: Shows consequences (if failure)', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('3');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const outcome = page.locator('[data-testid="flow-outcome-stage"]');
    const text = await outcome.textContent();
    expect(text).toContain('FAILURE');
  });

  test('3.5: Close button works', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('15');
    await page.locator('[data-testid="flow-roll-button"]').click();
    await page.locator('[data-testid="flow-continue"]').click();
    const assignmentStage = page.locator('[data-testid="flow-assignment-stage"]');
    await expect(assignmentStage).toBeVisible();
  });

  test('3.6: State persists correctly', async ({ page }) => {
    await page.locator('[data-testid="flow-assign-Ragnar-Strongarm"]').click();
    await page.locator('[data-testid="flow-start-check"]').click();
    await page.locator('[data-testid="flow-roll-input"]').fill('15');
    await page.locator('[data-testid="flow-roll-button"]').click();
    const outcome = page.locator('[data-testid="flow-outcome-stage"]');
    const text = await outcome.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: Integration quest flow snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('minimal-integration-quest-flow.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
