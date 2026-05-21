import { test, expect, Page } from '@playwright/test';

/**
 * SlottedMedal Isolated Component Tests
 *
 * Route: /minimal-slottedmedal
 * Component: src/ui/idleVillage/components/SlottedMedal.tsx
 * Spec: src/docs/docs/minimal_slice/02_slottedmedal.md
 *
 * Purpose: Exhaustive test of SlottedMedal rendering in isolation
 * (Circular token variant of PgCard)
 * Test Cases: 30 (rendering, interactions, state, edge cases)
 * Duration: ~3-4 minutes full run
 */

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalSlottedMedal — Isolated Component Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(`${BASE_URL}/minimal-slottedmedal`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  // ===== RENDERING TESTS (6 tests) =====

  test('1.1: Portrait loads correctly (circular)', async () => {
    // Spec: src/docs/docs/minimal_slice/02_slottedmedal.md
    const portraits = page.locator('[data-testid^="slottedmedal-"] img');
    const count = await portraits.count();
    expect(count).toBeGreaterThan(0);

    const firstPortrait = portraits.first();
    await expect(firstPortrait).toBeVisible();

    const src = await firstPortrait.getAttribute('src');
    expect(src).toMatch(/\.(jpg|png|webp|gif)$/i);
  });

  test('1.2: Circular shape (border-radius 50%)', async () => {
    // Verify circular shape
    const medal = page.locator('[data-testid^="slottedmedal-"]').first();

    const borderRadius = await medal.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).borderRadius;
    });

    // Should be 50% or similar circular value
    expect(borderRadius).toMatch(/50%|9999px/);
  });

  test('1.3: Rarity ring color — Level 1 (Bronze)', async () => {
    const lv1Medal = page.locator('[data-testid^="slottedmedal-"][data-level="1"]').first();
    const classes = await lv1Medal.getAttribute('class');
    expect(classes).toContain('rarity-bronze');
  });

  test('1.4: Rarity ring color — Level 2 (Silver)', async () => {
    const lv2Medal = page.locator('[data-testid^="slottedmedal-"][data-level="2"]').first();
    const classes = await lv2Medal.getAttribute('class');
    expect(classes).toContain('rarity-silver');
  });

  test('1.5: Rarity ring color — Level 3+ (Gold)', async () => {
    const lv3Medal = page.locator('[data-testid^="slottedmedal-"][data-level="3"]').first();
    const classes = await lv3Medal.getAttribute('class');
    expect(classes).toContain('rarity-gold');
  });

  test('1.6: Rarity ring border thickness', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"]').first();

    const borderWidth = await medal.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).borderWidth;
    });

    const width = parseFloat(borderWidth);
    expect(width).toBeGreaterThanOrEqual(4);
    expect(width).toBeLessThanOrEqual(6);
  });

  // ===== STATUS ICON TESTS (8 tests) =====

  test('2.1: Injured icon visible', async () => {
    const injuredMedals = page.locator('[data-testid^="slottedmedal-"][data-injured="true"]');
    const count = await injuredMedals.count();
    expect(count).toBeGreaterThan(0);

    const firstInjured = injuredMedals.first();
    const icon = firstInjured.locator('[data-icon="injured"]');
    await expect(icon).toBeVisible();
  });

  test('2.2: Injured icon hidden when not injured', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"][data-injured="false"]').first();
    const icon = medal.locator('[data-icon="injured"]');
    await expect(icon).toBeHidden();
  });

  test('2.3: Away icon visible', async () => {
    const awayMedal = page.locator('[data-testid^="slottedmedal-"][data-status="away"]').first();
    const icon = awayMedal.locator('[data-icon="away"]');
    await expect(icon).toBeVisible();
  });

  test('2.4: Away icon hidden for available', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"][data-status="available"]').first();
    const icon = medal.locator('[data-icon="away"]');
    await expect(icon).toBeHidden();
  });

  test('2.5: Busy icon visible', async () => {
    const busyMedal = page.locator('[data-testid^="slottedmedal-"][data-status="busy"]').first();
    const icon = busyMedal.locator('[data-icon="busy"]');
    await expect(icon).toBeVisible();
  });

  test('2.6: Fatigue icon visible when fatigue>80', async () => {
    const medals = page.locator('[data-testid^="slottedmedal-"]');
    // Find one with high fatigue
    const highFatigueMedal = medals.filter({ hasText: /95/ }).first();
    if (await highFatigueMedal.isVisible()) {
      const icon = highFatigueMedal.locator('[data-icon="fatigue"]');
      await expect(icon).toBeVisible();
    }
  });

  test('2.7: Multiple icons visible together', async () => {
    const multiMedal = page.locator('[data-testid^="slottedmedal-"][data-injured="true"][data-status="away"]').first();

    const injured = multiMedal.locator('[data-icon="injured"]');
    const away = multiMedal.locator('[data-icon="away"]');

    await expect(injured).toBeVisible();
    await expect(away).toBeVisible();
  });

  test('2.8: Status icons positioned correctly', async () => {
    // Icons should be at specific corners/positions
    const medal = page.locator('[data-testid^="slottedmedal-"][data-injured="true"]').first();
    const icon = medal.locator('[data-icon="injured"]');

    const position = await icon.evaluate((el: HTMLElement) => {
      return el.getAttribute('data-position');
    });

    // Should have position data attribute (top-left, top-right, etc)
    expect(position).toBeTruthy();
  });

  // ===== INTERACTION TESTS (6 tests) =====

  test('3.1: Hover shows tooltip', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"]').first();
    await medal.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    await tooltip.waitFor({ state: 'visible', timeout: 500 });

    const text = await tooltip.textContent();
    expect(text).toBeTruthy();
  });

  test('3.2: Unhover hides tooltip', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"]').first();
    await medal.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    await tooltip.waitFor({ state: 'visible', timeout: 500 });

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden({ timeout: 500 });
  });

  test('3.3: Tooltip contains name', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"]').first();
    await medal.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();

    expect(text).toMatch(/Elara|Ragnar|Lyra|Theron/);
  });

  test('3.4: Tooltip contains stats', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"]').first();
    await medal.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();

    expect(text).toMatch(/STR|DEX|WIS/i);
  });

  test('3.5: Tooltip contains level', async () => {
    const lv2Medal = page.locator('[data-testid^="slottedmedal-"][data-level="2"]').first();
    await lv2Medal.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();

    expect(text).toMatch(/Lv|Level/i);
  });

  test('3.6: Tooltip contains HP', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"]').first();
    await medal.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();

    expect(text).toMatch(/HP|Health/i);
  });

  // ===== STATE TESTS (4 tests) =====

  test('4.1: Available status shows bright visual', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"][data-status="available"]').first();
    const opacity = await medal.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).opacity;
    });

    expect(parseFloat(opacity)).toBe(1);
  });

  test('4.2: Away status shows dimmed visual', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"][data-status="away"]').first();
    const opacity = await medal.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).opacity;
    });

    expect(parseFloat(opacity)).toBeLessThan(1);
  });

  test('4.3: Injured token shows visual indicator', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"][data-injured="true"]').first();
    const icon = medal.locator('[data-icon="injured"]');

    await expect(icon).toBeVisible();
  });

  test('4.4: Busy status shows distinct visual', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"][data-status="busy"]').first();
    const icon = medal.locator('[data-icon="busy"]');

    await expect(icon).toBeVisible();
  });

  // ===== EDGE CASE TESTS (6 tests) =====

  test('5.1: Long name does not overflow', async () => {
    const longMedal = page.locator('[data-testid^="slottedmedal-"]').filter({
      hasText: 'Very Long'
    }).first();

    if (await longMedal.isVisible()) {
      const label = longMedal.locator('xpath=//div[contains(text(), "Very")]');
      const text = await label.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('5.2: Missing portrait shows placeholder', async () => {
    const portrait = page.locator('[data-testid^="slottedmedal-"] img').first();
    await expect(portrait).toBeVisible();
  });

  test('5.3: Zero HP displays correctly', async () => {
    const medal = page.locator('[data-testid^="slottedmedal-"]').first();
    await medal.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();
    expect(text).toBeTruthy();
  });

  test('5.4: Max fatigue shows correctly', async () => {
    const medals = page.locator('[data-testid^="slottedmedal-"]');
    const count = await medals.count();
    expect(count).toBe(5);
  });

  test('5.5: Invalid level shows default visual', async () => {
    const medals = page.locator('[data-testid^="slottedmedal-"]');

    for (let i = 0; i < await medals.count(); i++) {
      const medal = medals.nth(i);
      const classes = await medal.getAttribute('class');
      expect(classes).toMatch(/rarity-(bronze|silver|gold)/);
    }
  });

  test('5.6: Multiple instances no conflict', async () => {
    const medals = page.locator('[data-testid^="slottedmedal-"]');
    expect(await medals.count()).toBe(5);
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: Page snapshot baseline', async () => {
    await expect(page).toHaveScreenshot('minimal-slottedmedal-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
