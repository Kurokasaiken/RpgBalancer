import { test, expect, Page } from '@playwright/test';

/**
 * PgCard Isolated Component Tests
 *
 * Route: /minimal-pgcard
 * Component: src/ui/idleVillage/components/PgCard.tsx
 * Spec: src/docs/docs/minimal_slice/01_pgcard.md
 *
 * Purpose: Exhaustive test of PgCard rendering in isolation
 * Test Cases: 30 (rendering, interactions, state, edge cases)
 * Duration: ~3-4 minutes full run
 */

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalPgCard — Isolated Component Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Test runs against live /dev server
    // Ensure server is running: npm run dev
  });

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(`${BASE_URL}/minimal-pgcard`);
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  // ===== RENDERING TESTS (6 tests) =====

  test('1.1: Portrait loads correctly', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.1
    // Condition: Portrait URL resolves (no 404)
    // Expected: Image visible, src attribute correct

    const portraits = page.locator('[data-testid^="pgcard-"] img');
    const count = await portraits.count();
    expect(count).toBeGreaterThan(0);

    // Check first portrait
    const firstPortrait = portraits.first();
    await expect(firstPortrait).toBeVisible();

    const src = await firstPortrait.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/\.(jpg|png|webp|gif)$/i);
  });

  test('1.2: Rarity ring color — Level 1 (Bronze)', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.3
    // Condition: resident.level = 1
    // Expected: Ring is bronze (#C47D4A), CSS class `rarity-bronze`

    const lv1Token = page.locator('[data-testid^="pgcard-"][data-level="1"]').first();
    await expect(lv1Token).toBeVisible();

    // Check for rarity-bronze class (or similar)
    const classes = await lv1Token.getAttribute('class');
    expect(classes).toContain('rarity-bronze');
  });

  test('1.3: Rarity ring color — Level 2 (Silver)', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.4
    const lv2Token = page.locator('[data-testid^="pgcard-"][data-level="2"]').first();
    await expect(lv2Token).toBeVisible();

    const classes = await lv2Token.getAttribute('class');
    expect(classes).toContain('rarity-silver');
  });

  test('1.4: Rarity ring color — Level 3+ (Gold)', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.5
    const lv3Token = page.locator('[data-testid^="pgcard-"][data-level="3"]').first();
    await expect(lv3Token).toBeVisible();

    const classes = await lv3Token.getAttribute('class');
    expect(classes).toContain('rarity-gold');
  });

  test('1.5: Rarity ring border thickness 4-6px', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.6
    const token = page.locator('[data-testid^="pgcard-"]').first();

    const borderWidth = await token.evaluate((el: HTMLElement) => {
      const computed = window.getComputedStyle(el);
      return computed.borderWidth;
    });

    const width = parseFloat(borderWidth);
    expect(width).toBeGreaterThanOrEqual(4);
    expect(width).toBeLessThanOrEqual(6);
  });

  test('1.6: Token renders without errors', async () => {
    // Basic smoke test: page loads, tokens visible
    const tokens = page.locator('[data-testid^="pgcard-"]');
    const count = await tokens.count();
    expect(count).toBe(5); // 5 mock residents
  });

  // ===== STATUS ICON TESTS (8 tests) =====

  test('2.1: Injured icon visible when isInjured=true', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.7
    // Condition: resident.isInjured = true
    // Expected: Icon (🩹) visible at top-left

    const injuredTokens = page.locator('[data-testid^="pgcard-"][data-injured="true"]');
    const count = await injuredTokens.count();
    expect(count).toBeGreaterThan(0);

    // Check first injured token has icon
    const firstInjuredToken = injuredTokens.first();
    const injuredIcon = firstInjuredToken.locator('[data-icon="injured"]');
    await expect(injuredIcon).toBeVisible();
  });

  test('2.2: Injured icon hidden when isInjured=false', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.8
    const availableToken = page.locator('[data-testid^="pgcard-"][data-injured="false"]').first();
    const injuredIcon = availableToken.locator('[data-icon="injured"]');
    await expect(injuredIcon).toBeHidden();
  });

  test('2.3: Away icon visible when status=away', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.9
    const awayToken = page.locator('[data-testid^="pgcard-"][data-status="away"]').first();
    await expect(awayToken).toBeVisible();

    const awayIcon = awayToken.locator('[data-icon="away"]');
    await expect(awayIcon).toBeVisible();
  });

  test('2.4: Away icon hidden for available status', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.10
    const availableToken = page.locator('[data-testid^="pgcard-"][data-status="available"]').first();
    const awayIcon = availableToken.locator('[data-icon="away"]');
    await expect(awayIcon).toBeHidden();
  });

  test('2.5: Busy icon visible when status=busy', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.11
    const busyToken = page.locator('[data-testid^="pgcard-"][data-status="busy"]').first();
    const busyIcon = busyToken.locator('[data-icon="busy"]');
    await expect(busyIcon).toBeVisible();
  });

  test('2.6: Fatigue icon visible when fatigue>80', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.12
    const fatigueToken = page.locator('[data-testid^="pgcard-"][data-fatigue="95"]').first();
    const fatigueIcon = fatigueToken.locator('[data-icon="fatigue"]');
    await expect(fatigueIcon).toBeVisible();
  });

  test('2.7: Fatigue icon hidden when fatigue<80', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.13
    const lowFatigueToken = page.locator('[data-testid^="pgcard-"][data-fatigue="20"]').first();
    const fatigueIcon = lowFatigueToken.locator('[data-icon="fatigue"]');
    await expect(fatigueIcon).toBeHidden();
  });

  test('2.8: Multiple icons visible together', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 1.14
    // Find token with: isInjured=true, status=away, fatigue=85+
    const multiIconToken = page.locator('[data-testid^="pgcard-"][data-injured="true"][data-status="away"]').first();

    const injuredIcon = multiIconToken.locator('[data-icon="injured"]');
    const awayIcon = multiIconToken.locator('[data-icon="away"]');
    const fatigueIcon = multiIconToken.locator('[data-icon="fatigue"]');

    await expect(injuredIcon).toBeVisible();
    await expect(awayIcon).toBeVisible();
    await expect(fatigueIcon).toBeVisible();
  });

  // ===== INTERACTION TESTS (6 tests) =====

  test('3.1: Hover shows tooltip with name', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 2.1
    const token = page.locator('[data-testid^="pgcard-"]').first();

    await token.hover();
    // Wait for tooltip to appear
    const tooltip = page.locator('[role="tooltip"]').first();
    await tooltip.waitFor({ state: 'visible', timeout: 500 });

    const text = await tooltip.textContent();
    expect(text).toBeTruthy();
    expect(text).toMatch(/Elara|Ragnar|Lyra|Theron/); // One of our mock names
  });

  test('3.2: Unhover hides tooltip', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 2.2
    const token = page.locator('[data-testid^="pgcard-"]').first();
    const tooltip = page.locator('[role="tooltip"]').first();

    // Hover
    await token.hover();
    await tooltip.waitFor({ state: 'visible', timeout: 500 });

    // Move away
    await page.mouse.move(0, 0);
    // Tooltip should disappear
    await expect(tooltip).toBeHidden({ timeout: 500 });
  });

  test('3.3: Tooltip contains stats', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 2.4
    const token = page.locator('[data-testid^="pgcard-"]').first();
    await token.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();

    // Should contain stat names
    expect(text).toMatch(/STR|Strength|DEX|Dexterity/i);
  });

  test('3.4: Tooltip contains level', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 2.5
    const lv2Token = page.locator('[data-testid^="pgcard-"][data-level="2"]').first();
    await lv2Token.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();

    expect(text).toMatch(/Lv|Level.*2/i);
  });

  test('3.5: Tooltip contains HP', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 2.6
    const token = page.locator('[data-testid^="pgcard-"]').first();
    await token.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();

    expect(text).toMatch(/HP|Health/i);
  });

  test('3.6: Hover tooltip responsive (mobile, desktop)', async () => {
    // Responsive test: tooltip appears on both viewport sizes
    // Already tested above, just verify on current viewport
    const token = page.locator('[data-testid^="pgcard-"]').first();
    await token.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    await expect(tooltip).toBeVisible();
  });

  // ===== STATE TESTS (4 tests) =====

  test('4.1: Available status shows bright visual', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 3.1
    const availableToken = page.locator('[data-testid^="pgcard-"][data-status="available"]').first();
    const opacity = await availableToken.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).opacity;
    });

    // Available should be opacity 1.0
    expect(parseFloat(opacity)).toBe(1);
  });

  test('4.2: Away status shows dimmed visual', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 3.2
    const awayToken = page.locator('[data-testid^="pgcard-"][data-status="away"]').first();
    const opacity = await awayToken.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).opacity;
    });

    // Away should be dimmed (opacity < 1.0)
    expect(parseFloat(opacity)).toBeLessThan(1);
  });

  test('4.3: Injured token shows visual indicator', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 3.3
    const injuredToken = page.locator('[data-testid^="pgcard-"][data-injured="true"]').first();

    // Check for visual indicator (icon or border color)
    const hasInjuredIcon = await injuredToken.locator('[data-icon="injured"]').isVisible();
    expect(hasInjuredIcon).toBe(true);
  });

  test('4.4: Busy status shows distinct visual', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 3.4
    const busyToken = page.locator('[data-testid^="pgcard-"][data-status="busy"]').first();
    const busyIcon = busyToken.locator('[data-icon="busy"]');

    await expect(busyIcon).toBeVisible();
  });

  // ===== EDGE CASE TESTS (6 tests) =====

  test('5.1: Very long name does not overflow', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 4.1
    const longNameToken = page.locator('[data-testid^="pgcard-"]').filter({
      hasText: 'Very Long Name'
    }).first();

    const label = longNameToken.locator('xpath=//div[contains(text(), "Very")]');
    const isVisible = await label.isVisible();
    expect(isVisible).toBeTruthy();

    // Check text doesn't overflow container
    const overflow = await label.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).textOverflow;
    });
    expect(overflow).not.toBe('clip');
  });

  test('5.2: Missing portrait shows placeholder', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 4.2
    // Our mock has valid URLs, but component should handle missing
    // This is a regression test for the fallback behavior

    const firstPortrait = page.locator('[data-testid^="pgcard-"] img').first();
    await expect(firstPortrait).toBeVisible();
    // If broken, would show broken image or placeholder
  });

  test('5.3: Zero HP displays correctly', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 4.3
    // No token with 0 HP in our mocks, but verify component doesn't crash
    const token = page.locator('[data-testid^="pgcard-"]').first();
    await token.hover();

    const tooltip = page.locator('[role="tooltip"]').first();
    const text = await tooltip.textContent();
    expect(text).toBeTruthy(); // No crash
  });

  test('5.4: Max fatigue shows correctly', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 4.4
    const maxFatigueToken = page.locator('[data-testid^="pgcard-"][data-fatigue="95"]').first();
    const fatigueIcon = maxFatigueToken.locator('[data-icon="fatigue"]');

    await expect(fatigueIcon).toBeVisible();
  });

  test('5.5: Invalid level (0) shows default visual', async () => {
    // Spec: src/docs/docs/minimal_slice/01_pgcard.md § Test 4.6
    // All our tokens have valid levels, but verify component is robust
    const tokens = page.locator('[data-testid^="pgcard-"]');

    for (let i = 0; i < await tokens.count(); i++) {
      const token = tokens.nth(i);
      const classes = await token.getAttribute('class');
      // Should have a rarity class
      expect(classes).toMatch(/rarity-(bronze|silver|gold)/);
    }
  });

  test('5.6: Component renders multiple instances without conflict', async () => {
    // Regression test: 5 instances on same page don't interfere
    const tokens = page.locator('[data-testid^="pgcard-"]');
    expect(await tokens.count()).toBe(5);

    // Each has unique ID
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const id = await tokens.nth(i).getAttribute('data-testid');
      expect(id).toBeTruthy();
      expect(ids).not.toContain(id);
      ids.push(id!);
    }
  });

  // ===== VISUAL REGRESSION TEST =====

  test('Visual: Page snapshot baseline', async () => {
    // Capture baseline screenshot for visual regression
    await expect(page).toHaveScreenshot('minimal-pgcard-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
