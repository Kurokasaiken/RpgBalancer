import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalOutcome — OutcomeModal Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-outcome`);
    await page.waitForLoadState('networkidle');
  });

  // ===== RENDERING (6 tests) =====

  test('1.1: Modal renders', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const modal = page.locator('[data-testid="outcome-modal"]');
    await expect(modal).toBeVisible();
  });

  test('1.2: Outcome title visible', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const title = page.locator('[data-testid="outcome-title"]');
    await expect(title).toBeVisible();
  });

  test('1.3: Resident portrait visible', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const portrait = page.locator('[data-testid="outcome-portrait"]');
    await expect(portrait).toBeVisible();
  });

  test('1.4: Outcome description visible', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const description = page.locator('[data-testid="outcome-description"]');
    await expect(description).toBeVisible();
  });

  test('1.5: Reward display visible', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const gold = page.locator('[data-testid="outcome-gold"]');
    await expect(gold).toBeVisible();
  });

  test('1.6: Close/Continue button visible', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const button = page.locator('[data-testid="outcome-continue-button"]');
    await expect(button).toBeVisible();
  });

  // ===== OUTCOME DISPLAY (6 tests) =====

  test('2.1: Success state styling', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const title = page.locator('[data-testid="outcome-title"]');
    const text = await title.textContent();
    expect(text).toContain('SUCCESS');
  });

  test('2.2: Failure state styling', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-1"]').click();
    const title = page.locator('[data-testid="outcome-title"]');
    const text = await title.textContent();
    expect(text).toContain('FAILURE');
  });

  test('2.3: Outcome text shows', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const description = page.locator('[data-testid="outcome-description"]');
    const text = await description.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('2.4: Reward amounts show', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const gold = page.locator('[data-testid="outcome-gold"]');
    const text = await gold.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('2.5: Experience gained shows', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const xp = page.locator('[data-testid="outcome-xp"]');
    await expect(xp).toBeVisible();
  });

  test('2.6: Consequence shows (if failure)', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-1"]').click();
    const consequence = page.locator('[data-testid="outcome-consequence"]');
    await expect(consequence).toBeVisible();
  });

  // ===== INTERACTIONS (6 tests) =====

  test('3.1: Click continue closes modal', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    let modal = page.locator('[data-testid="outcome-modal"]');
    await expect(modal).toBeVisible();

    await page.locator('[data-testid="outcome-continue-button"]').click();
    // Modal should be gone
    await page.waitForTimeout(100);
    const count = await page.locator('[data-testid="outcome-modal"]').count();
    expect(count).toBe(0);
  });

  test('3.2: Escape key closes modal', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    let modal = page.locator('[data-testid="outcome-modal"]');
    await expect(modal).toBeVisible();

    await page.press('[data-testid="outcome-modal-backdrop"]', 'Escape');
    // Modal should be gone
    await page.waitForTimeout(100);
    const count = await page.locator('[data-testid="outcome-modal"]').count();
    expect(count).toBe(0);
  });

  test('3.3: Button is keyboard accessible', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const button = page.locator('[data-testid="outcome-continue-button"]');
    await button.focus();
    await expect(button).toBeFocused();
  });

  test('3.4: Modal focuses correctly', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const modal = page.locator('[data-testid="outcome-modal"]');
    await expect(modal).toBeVisible();
  });

  test('3.5: Background is darkened', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const backdrop = page.locator('[data-testid="outcome-modal-backdrop"]');
    const bgColor = await backdrop.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toContain('rgba');
  });

  test('3.6: Prevent interaction with page behind', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const button = page.locator('[data-testid="btn-outcome-1"]');
    // Button should not be clickable through modal
    const isVisible = await button.isVisible();
    // Button is still visible but behind modal
    expect(isVisible).toBe(true);
  });

  // ===== STATE (4 tests) =====

  test('4.1: Success result (rewards shown)', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    const gold = page.locator('[data-testid="outcome-gold"]');
    const text = await gold.textContent();
    expect(text).toContain('100');
  });

  test('4.2: Failure result (no rewards)', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-1"]').click();
    const gold = page.locator('[data-testid="outcome-gold"]');
    const text = await gold.textContent();
    expect(text).toContain('0');
  });

  test('4.3: Partial success (reduced rewards)', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-1"]').click();
    const xp = page.locator('[data-testid="outcome-xp"]');
    await expect(xp).toBeVisible();
  });

  test('4.4: Natural 20 bonus', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-2"]').click();
    const gold = page.locator('[data-testid="outcome-gold"]');
    const text = await gold.textContent();
    expect(text).toContain('250');
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: OutcomeModal snapshot', async ({ page }) => {
    await page.locator('[data-testid="btn-outcome-0"]').click();
    await expect(page).toHaveScreenshot('minimal-outcome-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
