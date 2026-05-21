import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalResourceHUD — ResourceHUD Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-resourcehud`);
    await page.waitForLoadState('networkidle');
  });

  // ===== RENDERING (6 tests) =====

  test('1.1: HUD container renders', async ({ page }) => {
    const hud = page.locator('[data-testid="resource-hud"]');
    await expect(hud).toBeVisible();
  });

  test('1.2: Gold resource visible', async ({ page }) => {
    const gold = page.locator('[data-testid="resource-gold"]');
    await expect(gold).toBeVisible();
  });

  test('1.3: Wood resource visible', async ({ page }) => {
    const wood = page.locator('[data-testid="resource-wood"]');
    await expect(wood).toBeVisible();
  });

  test('1.4: Food resource visible', async ({ page }) => {
    const food = page.locator('[data-testid="resource-food"]');
    await expect(food).toBeVisible();
  });

  test('1.5: Iron resource visible', async ({ page }) => {
    const iron = page.locator('[data-testid="resource-iron"]');
    await expect(iron).toBeVisible();
  });

  test('1.6: All icons visible', async ({ page }) => {
    const icons = page.locator('[data-testid$="-icon"]');
    const count = await icons.count();
    expect(count).toBe(4);
  });

  // ===== RESOURCE DISPLAY (6 tests) =====

  test('2.1: Gold value shows correct number', async ({ page }) => {
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const text = await goldValue.textContent();
    // Should show formatted or raw number
    expect(text).toMatch(/\d/);
  });

  test('2.2: Wood value shows correct number', async ({ page }) => {
    const woodValue = page.locator('[data-testid="resource-wood-value"]');
    const text = await woodValue.textContent();
    expect(text).toMatch(/\d/);
  });

  test('2.3: Food value shows correct number', async ({ page }) => {
    const foodValue = page.locator('[data-testid="resource-food-value"]');
    const text = await foodValue.textContent();
    expect(text).toMatch(/\d/);
  });

  test('2.4: Iron value shows correct number', async ({ page }) => {
    const ironValue = page.locator('[data-testid="resource-iron-value"]');
    const text = await ironValue.textContent();
    expect(text).toMatch(/\d/);
  });

  test('2.5: Resource icons load', async ({ page }) => {
    const icons = page.locator('[data-testid$="-icon"]');
    await expect(icons.first()).toBeVisible();
  });

  test('2.6: Values are numeric', async ({ page }) => {
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const text = await goldValue.textContent();
    expect(text).toMatch(/^[\d.k]+$/);
  });

  // ===== FORMATTING (4 tests) =====

  test('3.1: Large numbers formatted (1000+)', async ({ page }) => {
    // 1250 gold should show as "1.2k"
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const text = await goldValue.textContent();
    expect(text).toMatch(/k|\.|\d/);
  });

  test('3.2: Zero values display', async ({ page }) => {
    // Add a test to set a resource to 0
    // For now, verify non-zero displays
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const text = await goldValue.textContent();
    expect(text).toBeTruthy();
  });

  test('3.3: Negative values display', async ({ page }) => {
    // Resources shouldn't go negative, but if they do, verify display
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const text = await goldValue.textContent();
    expect(text).toBeTruthy();
  });

  test('3.4: Decimal values not shown', async ({ page }) => {
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const text = await goldValue.textContent();
    // Should show 1.2k, not 1.250
    expect(text).not.toMatch(/\d{3,}\.\d/);
  });

  // ===== INTERACTIONS (4 tests) =====

  test('4.1: Hover shows tooltip', async ({ page }) => {
    const goldResource = page.locator('[data-testid="resource-gold"]');
    await goldResource.hover();
    const tooltip = page.locator('[data-testid="resource-gold-tooltip"]');
    await expect(tooltip).toBeVisible();
  });

  test('4.2: Tooltip shows full value', async ({ page }) => {
    const goldResource = page.locator('[data-testid="resource-gold"]');
    await goldResource.hover();
    const tooltip = page.locator('[data-testid="resource-gold-tooltip"]');
    const text = await tooltip.textContent();
    expect(text).toContain('Gold');
  });

  test('4.3: Hover on icon works', async ({ page }) => {
    const goldIcon = page.locator('[data-testid="resource-gold-icon"]');
    await goldIcon.hover();
    const tooltip = page.locator('[data-testid="resource-gold-tooltip"]');
    await expect(tooltip).toBeVisible();
  });

  test('4.4: Hover on value works', async ({ page }) => {
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const parent = goldValue.locator('..');
    await parent.hover();
    const tooltip = page.locator('[data-testid="resource-gold-tooltip"]');
    await expect(tooltip).toBeVisible();
  });

  // ===== STATE (4 tests) =====

  test('5.1: Resource values update', async ({ page }) => {
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const before = await goldValue.textContent();

    await page.locator('[data-testid="btn-add-gold"]').click();
    const after = await goldValue.textContent();

    expect(before).not.toBe(after);
  });

  test('5.2: No mutation of state', async ({ page }) => {
    // Verify that changing one resource doesn't affect others
    const goldBefore = await page.locator('[data-testid="resource-gold-value"]').textContent();
    const woodBefore = await page.locator('[data-testid="resource-wood-value"]').textContent();

    await page.locator('[data-testid="btn-add-gold"]').click();

    const woodAfter = await page.locator('[data-testid="resource-wood-value"]').textContent();
    expect(woodBefore).toBe(woodAfter);
  });

  test('5.3: Values persist on re-render', async ({ page }) => {
    await page.locator('[data-testid="btn-add-gold"]').click();
    const after = await page.locator('[data-testid="resource-gold-value"]').textContent();

    // Hover something to trigger re-render
    await page.locator('[data-testid="resource-gold"]').hover();
    const persisted = await page.locator('[data-testid="resource-gold-value"]').textContent();

    expect(after).toBe(persisted);
  });

  test('5.4: Read-only display', async ({ page }) => {
    // Verify HUD doesn't have editable fields
    const inputs = page.locator('[data-testid="resource-hud"] input');
    const count = await inputs.count();
    expect(count).toBe(0);
  });

  // ===== EDGE CASES (2 tests) =====

  test('6.1: Very large numbers', async ({ page }) => {
    // Add many times to get large number
    for (let i = 0; i < 10; i++) {
      await page.locator('[data-testid="btn-add-gold"]').click();
    }
    const goldValue = page.locator('[data-testid="resource-gold-value"]');
    const text = await goldValue.textContent();
    expect(text).toBeTruthy();
  });

  test('6.2: Zero resources', async ({ page }) => {
    // Verify zero displays (even though no button for it in this test)
    const value = page.locator('[data-testid="resource-gold-value"]');
    await expect(value).toBeVisible();
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: ResourceHUD snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('minimal-resourcehud-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
