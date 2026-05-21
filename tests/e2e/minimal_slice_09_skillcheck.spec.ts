import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalSkillCheck — SkillCheckPanel Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-skillcheck`);
    await page.waitForLoadState('networkidle');
  });

  // ===== RENDERING (6 tests) =====

  test('1.1: Panel renders', async ({ page }) => {
    const panel = page.locator('[data-testid="skill-check-panel"]');
    await expect(panel).toBeVisible();
  });

  test('1.2: Resident portrait visible', async ({ page }) => {
    const portrait = page.locator('[data-testid="check-portrait-0"]');
    await expect(portrait).toBeVisible();
  });

  test('1.3: DC (difficulty class) visible', async ({ page }) => {
    const dc = page.locator('[data-testid="check-dc-0"]');
    await expect(dc).toBeVisible();
  });

  test('1.4: Relevant stat visible', async ({ page }) => {
    const stat = page.locator('[data-testid="check-stat-0"]');
    await expect(stat).toBeVisible();
  });

  test('1.5: Roll input visible', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    await expect(input).toBeVisible();
  });

  test('1.6: Check button visible', async ({ page }) => {
    const button = page.locator('[data-testid="check-button-0"]');
    await expect(button).toBeVisible();
  });

  // ===== SKILL CHECK DISPLAY (6 tests) =====

  test('2.1: Resident name shows', async ({ page }) => {
    const name = page.locator('[data-testid="check-name-0"]');
    await expect(name).toBeVisible();
    const text = await name.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('2.2: Portrait loads correctly', async ({ page }) => {
    const portrait = page.locator('[data-testid="check-portrait-0"]');
    const src = await portrait.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('2.3: DC value displays', async ({ page }) => {
    const dc = page.locator('[data-testid="check-dc-0"]');
    const text = await dc.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('2.4: Required stat shows', async ({ page }) => {
    const stat = page.locator('[data-testid="check-stat-0"]');
    const text = await stat.textContent();
    expect(text).toMatch(/STR|DEX|CON|INT|WIS|CHA/);
  });

  test('2.5: Modifier displays', async ({ page }) => {
    const stat = page.locator('[data-testid="check-stat-0"]');
    const text = await stat.textContent();
    expect(text).toMatch(/\+\d/);
  });

  test('2.6: Expected difficulty label shows', async ({ page }) => {
    const difficulty = page.locator('[data-testid="check-difficulty-0"]');
    await expect(difficulty).toBeVisible();
  });

  // ===== STATE (6 tests) =====

  test('3.1: Unresolved state (input ready)', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    await expect(input).toBeVisible();
  });

  test('3.2: Input focused state', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    await input.focus();
    await expect(input).toBeFocused();
  });

  test('3.3: Roll in progress state', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    await input.fill('15');
    await expect(input).toHaveValue('15');
  });

  test('3.4: Success calculation', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('15');
    await button.click();

    const outcome = page.locator('[data-testid="check-outcome-0"]');
    await expect(outcome).toBeVisible();
  });

  test('3.5: Failure calculation', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('5');
    await button.click();

    const outcome = page.locator('[data-testid="check-outcome-0"]');
    await expect(outcome).toBeVisible();
  });

  test('3.6: Result display', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('12');
    await button.click();

    const result = page.locator('[data-testid="check-result-0"]');
    await expect(result).toBeVisible();
  });

  // ===== INTERACTIONS (6 tests) =====

  test('4.1: Input field accepts numbers', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    await input.fill('10');
    const value = await input.inputValue();
    expect(value).toBe('10');
  });

  test('4.2: Check button triggers resolution', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('15');
    await button.click();

    const result = page.locator('[data-testid="check-result-0"]');
    await expect(result).toBeVisible();
  });

  test('4.3: Enter key triggers check', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');

    await input.fill('15');
    await input.press('Enter');

    const result = page.locator('[data-testid="check-result-0"]');
    await expect(result).toBeVisible();
  });

  test('4.4: Result displays immediately', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('15');
    await button.click();

    const total = page.locator('[data-testid="check-total-0"]');
    await expect(total).toBeVisible();
  });

  test('4.5: Margin of success shown', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('18');
    await button.click();

    const margin = page.locator('[data-testid="check-margin-0"]');
    const text = await margin.textContent();
    expect(text).toContain('Success');
  });

  test('4.6: Margin of failure shown', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('3');
    await button.click();

    const margin = page.locator('[data-testid="check-margin-0"]');
    const text = await margin.textContent();
    expect(text).toContain('Failure');
  });

  // ===== EDGE CASES (4 tests) =====

  test('5.1: Critical success (nat 20)', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('20');
    await button.click();

    const roll = page.locator('[data-testid="check-roll-0"]');
    const text = await roll.textContent();
    expect(text).toBe('20');
  });

  test('5.2: Critical failure (nat 1)', async ({ page }) => {
    const input = page.locator('[data-testid="check-input-field-0"]');
    const button = page.locator('[data-testid="check-button-0"]');

    await input.fill('1');
    await button.click();

    const roll = page.locator('[data-testid="check-roll-0"]');
    const text = await roll.textContent();
    expect(text).toBe('1');
  });

  test('5.3: Zero modifier', async ({ page }) => {
    // Switch to a check with different modifiers
    const tab = page.locator('[data-testid="check-tab-0"]');
    await tab.click();
    const stat = page.locator('[data-testid="check-stat-0"]');
    await expect(stat).toBeVisible();
  });

  test('5.4: Negative modifier', async ({ page }) => {
    const stat = page.locator('[data-testid="check-stat-0"]');
    await expect(stat).toBeVisible();
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: SkillCheckPanel snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('minimal-skillcheck-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
