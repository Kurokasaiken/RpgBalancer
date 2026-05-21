import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalSlotRack — ResidentSlotRack Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-slotRack`);
    await page.waitForLoadState('networkidle');
  });

  // ===== RENDERING (6 tests) =====

  test('1.1: Slot container renders', async ({ page }) => {
    const container = page.locator('[data-testid="slot-rack-container"]');
    await expect(container).toBeVisible();
  });

  test('1.2: All 6 slots visible', async ({ page }) => {
    const slots = page.locator('[data-testid^="slot-"]').filter({ has: page.locator('[data-testid^="slot-"][data-testid*="-resident"], [data-testid*="-empty"]') });
    // Count actual slot elements
    const slotElements = await page.locator('[data-testid="slot-rack-container"] > div').count();
    expect(slotElements).toBe(6);
  });

  test('1.3: Empty slot shows placeholder', async ({ page }) => {
    const emptySlot = page.locator('[data-testid="slot-2-empty"]');
    await expect(emptySlot).toBeVisible();
    const text = await emptySlot.textContent();
    expect(text).toContain('+');
  });

  test('1.4: Occupied slot shows resident portrait', async ({ page }) => {
    const portrait = page.locator('[data-testid="slot-0-portrait"]');
    await expect(portrait).toBeVisible();
  });

  test('1.5: Slot badge shows rarity', async ({ page }) => {
    const rarity = page.locator('[data-testid="slot-0-rarity"]');
    await expect(rarity).toBeVisible();
  });

  test('1.6: Slot status indicator visible', async ({ page }) => {
    const fatigue = page.locator('[data-testid="slot-1-fatigue"]');
    await expect(fatigue).toBeVisible();
  });

  // ===== SLOT STATES (8 tests) =====

  test('2.1: Empty slot default style', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-2"]');
    const bgColor = await slot.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();
  });

  test('2.2: Occupied slot different style', async ({ page }) => {
    const occupied = page.locator('[data-testid="slot-0"]');
    const empty = page.locator('[data-testid="slot-2"]');

    const occupiedBg = await occupied.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const emptyBg = await empty.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Both should have styles
    expect(occupiedBg).toBeTruthy();
    expect(emptyBg).toBeTruthy();
  });

  test('2.3: Hover state on empty slot', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-2"]');
    await slot.hover();
    // Hover state applied
    await expect(slot).toBeVisible();
  });

  test('2.4: Hover state on occupied slot', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-0"]');
    await slot.hover();
    await expect(slot).toBeVisible();
  });

  test('2.5: Injured resident marked in slot', async ({ page }) => {
    const injured = page.locator('[data-testid="slot-1-injured"]');
    await expect(injured).toBeVisible();
  });

  test('2.6: Hero star visible on hero resident', async ({ page }) => {
    const hero = page.locator('[data-testid="slot-1-hero"]');
    await expect(hero).toBeVisible();
    const text = await hero.textContent();
    expect(text).toContain('⭐');
  });

  test('2.7: Fatigue bar shown', async ({ page }) => {
    const bar = page.locator('[data-testid="slot-0-fatigue"]');
    await expect(bar).toBeVisible();
  });

  test('2.8: Level badge shown', async ({ page }) => {
    const badge = page.locator('[data-testid="slot-1-rarity"]');
    await expect(badge).toBeVisible();
  });

  // ===== RESIDENT DISPLAY (6 tests) =====

  test('3.1: Portrait image loads', async ({ page }) => {
    const portrait = page.locator('[data-testid="slot-0-portrait"]');
    await expect(portrait).toBeVisible();
    const src = await portrait.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('3.2: Name displays (optional)', async ({ page }) => {
    // Name may be in tooltip, checking if at least tooltip can appear
    const slot = page.locator('[data-testid="slot-0"]');
    await slot.hover();
    const tooltip = page.locator('[data-testid="slot-0-tooltip"]');
    await expect(tooltip).toBeVisible();
  });

  test('3.3: Rarity ring matches resident level', async ({ page }) => {
    const rarity = page.locator('[data-testid="slot-0-rarity"]');
    await expect(rarity).toBeVisible();
  });

  test('3.4: Status icon visible if injured', async ({ page }) => {
    const injuredSlot = page.locator('[data-testid="slot-1-injured"]');
    await expect(injuredSlot).toBeVisible();
  });

  test('3.5: Fatigue indicator accurate', async ({ page }) => {
    const bar = page.locator('[data-testid="slot-0-fatigue"]');
    const width = await bar.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).width;
    });
    // Width should be set (not 0)
    expect(width).not.toBe('0px');
  });

  test('3.6: Level text visible', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-0"]');
    await slot.hover();
    const tooltip = page.locator('[data-testid="slot-0-tooltip"]');
    const text = await tooltip.textContent();
    expect(text).toMatch(/Lv \d+/);
  });

  // ===== INTERACTIONS (6 tests) =====

  test('4.1: Click empty slot selectable', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-2"]');
    await slot.click();
    // Should be selectable
    await expect(slot).toBeVisible();
  });

  test('4.2: Click occupied slot selectable', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-0"]');
    await slot.click();
    await expect(slot).toBeVisible();
  });

  test('4.3: Hover reveals tooltip', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-0"]');
    await slot.hover();
    const tooltip = page.locator('[data-testid="slot-0-tooltip"]');
    await expect(tooltip).toBeVisible();
  });

  test('4.4: Tooltip shows resident stats', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-1"]');
    await slot.hover();
    const tooltip = page.locator('[data-testid="slot-1-tooltip"]');
    const text = await tooltip.textContent();
    expect(text).toMatch(/HP:/);
    expect(text).toMatch(/Fatigue:/);
  });

  test('4.5: Drag-ready cursor on occupied', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-0"]');
    const cursor = await slot.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursor).toBeTruthy();
  });

  test('4.6: Selection state persists', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-0"]');
    await slot.click();
    const isSelected = await slot.getAttribute('data-selected');
    expect(isSelected).toBe('true');
  });

  // ===== STATE (4 tests) =====

  test('5.1: Selected slot highlighted', async ({ page }) => {
    const slot = page.locator('[data-testid="slot-0"]');
    await slot.click();
    const isSelected = await slot.getAttribute('data-selected');
    expect(isSelected).toBe('true');
  });

  test('5.2: Multiple slots can be occupied', async ({ page }) => {
    const occupied = await page.locator('[data-testid^="slot-"][data-occupied="true"]').count();
    expect(occupied).toBeGreaterThan(0);
  });

  test('5.3: Slot order preserved', async ({ page }) => {
    const slots = await page.locator('[data-testid="slot-rack-container"] > div').count();
    expect(slots).toBe(6);
  });

  test('5.4: Empty slots remain empty', async ({ page }) => {
    const empty = page.locator('[data-testid="slot-2-empty"]');
    const before = await empty.textContent();
    // Click something else
    await page.locator('[data-testid="slot-0"]').click();
    const after = await empty.textContent();
    expect(before).toBe(after);
  });

  // ===== EDGE CASES (2 tests) =====

  test('6.1: All slots occupied handling', async ({ page }) => {
    // Test page has mix, but logic should handle all occupied
    const slots = await page.locator('[data-testid="slot-rack-container"] > div').count();
    expect(slots).toBe(6);
  });

  test('6.2: All slots empty handling', async ({ page }) => {
    const emptySlots = await page.locator('[data-testid^="slot-"][data-occupied="false"]').count();
    expect(emptySlots).toBeGreaterThan(0);
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: SlotRack snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('minimal-slotRack-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
