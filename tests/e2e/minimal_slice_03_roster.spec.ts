import { test, expect } from '@playwright/test';

/**
 * VillageRosterSection Tests
 * Route: /minimal-roster
 * Spec: src/docs/docs/minimal_slice/03_roster.md
 */

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalRoster — VillageRosterSection Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-roster`);
    await page.waitForLoadState('networkidle');
  });

  // ===== RENDERING (6 tests) =====

  test('1.1: Roster renders list of residents', async ({ page }) => {
    const rosterItems = page.locator('[data-testid^="roster-item-"]');
    const count = await rosterItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('1.2: All residents visible initially', async ({ page }) => {
    const rosterItems = page.locator('[data-testid^="roster-item-"]');
    expect(await rosterItems.count()).toBe(10);
  });

  test('1.3: Sort dropdown renders', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await expect(sortDropdown).toBeVisible();
  });

  test('1.4: Filter dropdown renders', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    await expect(filterDropdown).toBeVisible();
  });

  test('1.5: Resident count display shows', async ({ page }) => {
    const countText = page.locator('text=/Showing.*residents/');
    await expect(countText).toBeVisible();
  });

  test('1.6: Each resident has name and meta', async ({ page }) => {
    const firstItem = page.locator('[data-testid^="roster-item-"]').first();
    const name = firstItem.locator('div:nth-child(1)');
    const meta = firstItem.locator('div:nth-child(2)');

    await expect(name).toBeVisible();
    await expect(meta).toBeVisible();
  });

  // ===== SORTING (8 tests) =====

  test('2.1: Sort A-Z', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.selectOption('name-asc');

    const items = page.locator('[data-testid^="roster-item-"]');
    const names = [];

    for (let i = 0; i < await items.count(); i++) {
      const name = await items.nth(i).locator('div:first-child').textContent();
      if (name) names.push(name.trim());
    }

    // Verify alphabetical order
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeLessThanOrEqual(0);
    }
  });

  test('2.2: Sort Z-A', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.selectOption('name-desc');

    const items = page.locator('[data-testid^="roster-item-"]');
    const names = [];

    for (let i = 0; i < await items.count(); i++) {
      const name = await items.nth(i).locator('div:first-child').textContent();
      if (name) names.push(name.trim());
    }

    // Verify reverse alphabetical order
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeGreaterThanOrEqual(0);
    }
  });

  test('2.3: Sort by Rarity (high first)', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.selectOption('rarity');

    const items = page.locator('[data-testid^="roster-item-"]');
    const levels = [];

    for (let i = 0; i < await items.count(); i++) {
      const level = await items.nth(i).getAttribute('data-level');
      if (level) levels.push(parseInt(level));
    }

    // Verify descending levels
    for (let i = 0; i < levels.length - 1; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i + 1]);
    }
  });

  test('2.4: Sort by Status (available first)', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.selectOption('status');

    const items = page.locator('[data-testid^="roster-item-"]');
    const statuses = [];

    for (let i = 0; i < await items.count(); i++) {
      const status = await items.nth(i).getAttribute('data-status');
      if (status) statuses.push(status);
    }

    // Verify available comes first
    const firstStatus = statuses[0];
    expect(firstStatus).toBe('available');
  });

  test('2.5: Sort updates DOM order', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');

    // Get initial order
    await sortDropdown.selectOption('name-asc');
    const items1 = page.locator('[data-testid^="roster-item-"]');
    const name1 = await items1.first().locator('div:first-child').textContent();

    // Change sort
    await sortDropdown.selectOption('name-desc');
    const items2 = page.locator('[data-testid^="roster-item-"]');
    const name2 = await items2.first().locator('div:first-child').textContent();

    // First item should change
    expect(name1).not.toBe(name2);
  });

  test('2.6: Sort persists on state', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.selectOption('rarity');

    const firstLevel = await page.locator('[data-testid^="roster-item-"]').first().getAttribute('data-level');
    expect(firstLevel).toBe('3'); // Highest level first
  });

  test('2.7: Multiple sorts work', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');

    await sortDropdown.selectOption('name-asc');
    let count1 = await page.locator('[data-testid^="roster-item-"]').count();

    await sortDropdown.selectOption('rarity');
    let count2 = await page.locator('[data-testid^="roster-item-"]').count();

    expect(count1).toBe(count2); // Same count, different order
  });

  test('2.8: Unsorted returns default', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.selectOption('name-asc');
    const name1 = await page.locator('[data-testid^="roster-item-"]').first().locator('div:first-child').textContent();

    await sortDropdown.selectOption('rarity');
    await sortDropdown.selectOption('name-asc');
    const name2 = await page.locator('[data-testid^="roster-item-"]').first().locator('div:first-child').textContent();

    expect(name1).toBe(name2); // Same order after re-selecting
  });

  // ===== FILTERING (8 tests) =====

  test('3.1: Filter Available', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    await filterDropdown.selectOption('available');

    const items = page.locator('[data-testid^="roster-item-"]');
    for (let i = 0; i < await items.count(); i++) {
      const status = await items.nth(i).getAttribute('data-status');
      expect(status).toBe('available');
    }
  });

  test('3.2: Filter Away', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    await filterDropdown.selectOption('away');

    const items = page.locator('[data-testid^="roster-item-"]');
    for (let i = 0; i < await items.count(); i++) {
      const status = await items.nth(i).getAttribute('data-status');
      expect(status).toBe('away');
    }
  });

  test('3.3: Filter Injured', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    await filterDropdown.selectOption('injured');

    const items = page.locator('[data-testid^="roster-item-"]');
    expect(await items.count()).toBeGreaterThan(0);
    // Injured residents shown
  });

  test('3.4: Filter Busy', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    await filterDropdown.selectOption('busy');

    const items = page.locator('[data-testid^="roster-item-"]');
    for (let i = 0; i < await items.count(); i++) {
      const status = await items.nth(i).getAttribute('data-status');
      expect(status).toBe('busy');
    }
  });

  test('3.5: Filter All shows all', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');

    await filterDropdown.selectOption('available');
    const count1 = await page.locator('[data-testid^="roster-item-"]').count();

    await filterDropdown.selectOption('all');
    const count2 = await page.locator('[data-testid^="roster-item-"]').count();

    expect(count2).toBeGreaterThan(count1);
  });

  test('3.6: Filter updates instantly', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    const initialCount = await page.locator('[data-testid^="roster-item-"]').count();

    await filterDropdown.selectOption('available');
    const filteredCount = await page.locator('[data-testid^="roster-item-"]').count();

    // Should show fewer (or equal) residents
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('3.7: Filter + Sort work together', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');

    await filterDropdown.selectOption('available');
    await sortDropdown.selectOption('name-asc');

    const items = page.locator('[data-testid^="roster-item-"]');

    // All should be available
    for (let i = 0; i < await items.count(); i++) {
      expect(await items.nth(i).getAttribute('data-status')).toBe('available');
    }

    // Should be sorted A-Z
    const names = [];
    for (let i = 0; i < await items.count(); i++) {
      const name = await items.nth(i).locator('div:first-child').textContent();
      if (name) names.push(name.trim());
    }

    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeLessThanOrEqual(0);
    }
  });

  test('3.8: Count reflects filter', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    const countText = page.locator('text=/Showing.*residents/');

    await filterDropdown.selectOption('available');
    const text1 = await countText.textContent();

    await filterDropdown.selectOption('away');
    const text2 = await countText.textContent();

    // Text should differ
    expect(text1).not.toBe(text2);
  });

  // ===== INTERACTIONS (6 tests) =====

  test('4.1: Hover resident', async ({ page }) => {
    const resident = page.locator('[data-testid^="roster-item-"]').first();
    await resident.hover();
    // Visual feedback (opacity change, highlight, etc)
    await expect(resident).toBeVisible();
  });

  test('4.2: Resident item has attributes', async ({ page }) => {
    const resident = page.locator('[data-testid^="roster-item-"]').first();
    const status = await resident.getAttribute('data-status');
    const level = await resident.getAttribute('data-level');

    expect(status).toBeTruthy();
    expect(level).toBeTruthy();
  });

  test('4.3: Click resident (future integration)', async ({ page }) => {
    const resident = page.locator('[data-testid^="roster-item-"]').first();
    // In isolated test, just verify clickable
    const box = await resident.boundingBox();
    expect(box).toBeTruthy();
  });

  test('4.4: Resident name is readable', async ({ page }) => {
    const resident = page.locator('[data-testid^="roster-item-"]').first();
    const name = await resident.locator('div:first-child').textContent();
    expect(name).toBeTruthy();
    expect(name?.length).toBeGreaterThan(0);
  });

  test('4.5: Resident meta shows level and status', async ({ page }) => {
    const resident = page.locator('[data-testid^="roster-item-"]').first();
    const meta = await resident.locator('div:nth-child(2)').textContent();
    expect(meta).toMatch(/Lv \d+/);
    expect(meta).toMatch(/available|away|busy|injured/i);
  });

  test('4.6: Multiple residents selectable', async ({ page }) => {
    const residents = page.locator('[data-testid^="roster-item-"]');
    const count = await residents.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const resident = residents.nth(i);
      await expect(resident).toBeVisible();
    }
  });

  // ===== STATE (4 tests) =====

  test('5.1: Roster reflects count', async ({ page }) => {
    const items = page.locator('[data-testid^="roster-item-"]');
    const count = await items.count();
    const countText = page.locator('text=/Showing.*residents/');
    const text = await countText.textContent();

    expect(text).toContain(count.toString());
  });

  test('5.2: All residents have unique IDs', async ({ page }) => {
    const items = page.locator('[data-testid^="roster-item-"]');
    const ids = new Set();

    for (let i = 0; i < await items.count(); i++) {
      const id = await items.nth(i).getAttribute('data-testid');
      expect(id).toBeTruthy();
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
  });

  test('5.3: Resident levels vary', async ({ page }) => {
    const items = page.locator('[data-testid^="roster-item-"]');
    const levels = new Set();

    for (let i = 0; i < await items.count(); i++) {
      const level = await items.nth(i).getAttribute('data-level');
      if (level) levels.add(level);
    }

    expect(levels.size).toBeGreaterThan(1); // Multiple levels
  });

  test('5.4: Resident statuses vary', async ({ page }) => {
    const items = page.locator('[data-testid^="roster-item-"]');
    const statuses = new Set();

    for (let i = 0; i < await items.count(); i++) {
      const status = await items.nth(i).getAttribute('data-status');
      if (status) statuses.add(status);
    }

    expect(statuses.size).toBeGreaterThan(1); // Multiple statuses
  });

  // ===== EDGE CASES (6 tests) =====

  test('6.1: Roster renders 10 residents', async ({ page }) => {
    const items = page.locator('[data-testid^="roster-item-"]');
    expect(await items.count()).toBe(10);
  });

  test('6.2: Roster handles single resident filter', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    await filterDropdown.selectOption('busy');

    const items = page.locator('[data-testid^="roster-item-"]');
    const count = await items.count();

    expect(count).toBeGreaterThan(0);
  });

  test('6.3: Roster handles all filter same level', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.selectOption('rarity');

    const items = page.locator('[data-testid^="roster-item-"]');
    expect(await items.count()).toBe(10);
  });

  test('6.4: Roster handles mixed statuses', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    await filterDropdown.selectOption('all');

    const statuses = new Set();
    const items = page.locator('[data-testid^="roster-item-"]');

    for (let i = 0; i < await items.count(); i++) {
      const status = await items.nth(i).getAttribute('data-status');
      statuses.add(status);
    }

    expect(statuses.size).toBeGreaterThanOrEqual(2);
  });

  test('6.5: Sort and filter together work', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');

    await filterDropdown.selectOption('available');
    await sortDropdown.selectOption('rarity');

    const items = page.locator('[data-testid^="roster-item-"]');
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('6.6: Roster returns to all when "all" selected', async ({ page }) => {
    const filterDropdown = page.locator('[data-testid="filter-dropdown"]');

    const initialCount = await page.locator('[data-testid^="roster-item-"]').count();

    await filterDropdown.selectOption('available');
    const filteredCount = await page.locator('[data-testid^="roster-item-"]').count();

    await filterDropdown.selectOption('all');
    const finalCount = await page.locator('[data-testid^="roster-item-"]').count();

    expect(finalCount).toBe(initialCount);
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: Roster page snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('minimal-roster-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
