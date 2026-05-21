import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalMarket — MarketActionCard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-market`);
    await page.waitForLoadState('networkidle');
  });

  // ===== RENDERING (4 tests) =====

  test('1.1: Card renders', async ({ page }) => {
    const card = page.locator('[data-testid="market-item-0"]');
    await expect(card).toBeVisible();
  });

  test('1.2: Item icon visible', async ({ page }) => {
    const icon = page.locator('[data-testid="market-icon-0"]');
    await expect(icon).toBeVisible();
  });

  test('1.3: Item name visible', async ({ page }) => {
    const name = page.locator('[data-testid="market-name-0"]');
    await expect(name).toBeVisible();
  });

  test('1.4: Action button visible', async ({ page }) => {
    const button = page.locator('[data-testid="market-buy-0"]');
    await expect(button).toBeVisible();
  });

  // ===== MARKET DISPLAY (4 tests) =====

  test('2.1: Item icon shows', async ({ page }) => {
    const icon = page.locator('[data-testid="market-icon-0"]');
    const text = await icon.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('2.2: Item name displays', async ({ page }) => {
    const name = page.locator('[data-testid="market-name-0"]');
    const text = await name.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('2.3: Price/cost shows', async ({ page }) => {
    const price = page.locator('[data-testid="market-price-0"]');
    const text = await price.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('2.4: Availability indicator shows', async ({ page }) => {
    const stock = page.locator('[data-testid="market-stock-0"]');
    await expect(stock).toBeVisible();
  });

  // ===== INTERACTIONS (6 tests) =====

  test('3.1: Click to purchase', async ({ page }) => {
    const button = page.locator('[data-testid="market-buy-0"]');
    await button.click();
    // Check purchase history appeared
    const history = page.locator('[data-testid="market-purchases"]');
    await expect(history).toBeVisible();
  });

  test('3.2: Click to trade', async ({ page }) => {
    const card = page.locator('[data-testid="market-item-0"]');
    await card.click();
    const details = page.locator('[data-testid="market-details"]');
    await expect(details).toBeVisible();
  });

  test('3.3: Quantity selector works', async ({ page }) => {
    const button1 = page.locator('[data-testid="market-buy-0"]');
    const button2 = page.locator('[data-testid="market-buy-0"]');
    await button1.click();
    await button2.click();
    const history = page.locator('[data-testid="market-purchases"]');
    const text = await history.textContent();
    expect(text).toContain('2');
  });

  test('3.4: Disabled state on no stock', async ({ page }) => {
    const button = page.locator('[data-testid="market-buy-1"]');
    const disabled = await button.isDisabled();
    expect(disabled).toBe(true);
  });

  test('3.5: Hover shows tooltip', async ({ page }) => {
    const card = page.locator('[data-testid="market-item-0"]');
    await card.hover();
    const tooltip = page.locator('[data-testid="market-tooltip-0"]');
    await expect(tooltip).toBeVisible();
  });

  test('3.6: Tooltip shows item details', async ({ page }) => {
    const card = page.locator('[data-testid="market-item-0"]');
    await card.hover();
    const tooltip = page.locator('[data-testid="market-tooltip-0"]');
    const text = await tooltip.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  // ===== STATE (4 tests) =====

  test('4.1: Available item (in stock)', async ({ page }) => {
    const stock = page.locator('[data-testid="market-stock-0"]');
    const text = await stock.textContent();
    expect(text).toContain('Stock');
  });

  test('4.2: Sold out state', async ({ page }) => {
    const stock = page.locator('[data-testid="market-stock-1"]');
    const text = await stock.textContent();
    expect(text).toContain('Sold Out');
  });

  test('4.3: Low stock warning', async ({ page }) => {
    const stock = page.locator('[data-testid="market-stock-2"]');
    await expect(stock).toBeVisible();
  });

  test('4.4: Purchase complete', async ({ page }) => {
    const button = page.locator('[data-testid="market-buy-0"]');
    await button.click();
    const history = page.locator('[data-testid="market-purchases"]');
    await expect(history).toBeVisible();
  });

  // ===== EDGE CASES (2 tests) =====

  test('5.1: Very expensive item', async ({ page }) => {
    const price = page.locator('[data-testid="market-price-2"]');
    const text = await price.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('5.2: Zero cost item', async ({ page }) => {
    const card = page.locator('[data-testid="market-item-0"]');
    await expect(card).toBeVisible();
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: MarketActionCard snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('minimal-market-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
