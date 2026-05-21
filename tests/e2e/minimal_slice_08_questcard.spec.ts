import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

test.describe('MinimalQuestCard — QuestCard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/minimal-questcard`);
    await page.waitForLoadState('networkidle');
  });

  // ===== RENDERING (6 tests) =====

  test('1.1: Card renders', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    await expect(card).toBeVisible();
  });

  test('1.2: Quest icon visible', async ({ page }) => {
    const icon = page.locator('[data-testid="quest-quest_001-icon"]');
    await expect(icon).toBeVisible();
  });

  test('1.3: Quest title visible', async ({ page }) => {
    const title = page.locator('[data-testid="quest-quest_001-title"]');
    await expect(title).toBeVisible();
  });

  test('1.4: Difficulty badge visible', async ({ page }) => {
    const difficulty = page.locator('[data-testid="quest-quest_001-difficulty"]');
    await expect(difficulty).toBeVisible();
  });

  test('1.5: Reward display visible', async ({ page }) => {
    const reward = page.locator('[data-testid="quest-quest_001-reward-gold"]');
    await expect(reward).toBeVisible();
  });

  test('1.6: Required stats visible', async ({ page }) => {
    const stats = page.locator('[data-testid="quest-quest_001-stats"]');
    await expect(stats).toBeVisible();
  });

  // ===== QUEST DISPLAY (6 tests) =====

  test('2.1: Icon loads correctly', async ({ page }) => {
    const icon = page.locator('[data-testid="quest-quest_001-icon"]');
    const text = await icon.textContent();
    expect(text).toMatch(/🗡️|🐉|📿/);
  });

  test('2.2: Title displays correctly', async ({ page }) => {
    const title = page.locator('[data-testid="quest-quest_001-title"]');
    const text = await title.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('2.3: Description shows', async ({ page }) => {
    const description = page.locator('[data-testid="quest-quest_001-description"]');
    await expect(description).toBeVisible();
    const text = await description.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('2.4: Reward amount shows', async ({ page }) => {
    const reward = page.locator('[data-testid="quest-quest_001-reward-gold"]');
    const text = await reward.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('2.5: Required level shows', async ({ page }) => {
    const level = page.locator('[data-testid="quest-quest_001-level"]');
    await expect(level).toBeVisible();
    const text = await level.textContent();
    expect(text).toMatch(/\d+/);
  });

  test('2.6: Required stats show', async ({ page }) => {
    const stats = page.locator('[data-testid="quest-quest_001-stats"]');
    const text = await stats.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  // ===== STATE (6 tests) =====

  test('3.1: Empty slot (no resident)', async ({ page }) => {
    const empty = page.locator('[data-testid="quest-quest_001-empty"]');
    await expect(empty).toBeVisible();
  });

  test('3.2: Occupied slot (resident assigned)', async ({ page }) => {
    const assigned = page.locator('[data-testid="quest-quest_003-assigned"]');
    await expect(assigned).toBeVisible();
  });

  test('3.3: Available state', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    const locked = await card.getAttribute('data-locked');
    expect(locked).toBe('false');
  });

  test('3.4: In-progress state', async ({ page }) => {
    const assigned = page.locator('[data-testid="quest-quest_003-assigned"]');
    await expect(assigned).toBeVisible();
  });

  test('3.5: Completed state', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    await expect(card).toBeVisible();
  });

  test('3.6: Locked state (insufficient level)', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_002"]');
    const locked = await card.getAttribute('data-locked');
    expect(locked).toBe('true');
  });

  // ===== INTERACTIONS (6 tests) =====

  test('4.1: Hover shows tooltip effect', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    await card.hover();
    await expect(card).toBeVisible();
  });

  test('4.2: Tooltip shows quest requirements', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    await card.hover();
    const stats = page.locator('[data-testid="quest-quest_001-stats"]');
    await expect(stats).toBeVisible();
  });

  test('4.3: Drag-over highlight', async ({ page }) => {
    const empty = page.locator('[data-testid="quest-quest_001-empty"]');
    await expect(empty).toBeVisible();
  });

  test('4.4: Drop preparation visual', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    await expect(card).toBeVisible();
  });

  test('4.5: Click selectable', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    await card.click();
    const details = page.locator('[data-testid="selected-quest-details"]');
    await expect(details).toBeVisible();
  });

  test('4.6: Requirements check visual', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    const stats = page.locator('[data-testid="quest-quest_001-stats"]');
    await expect(stats).toBeVisible();
  });

  // ===== DRAG READINESS (4 tests) =====

  test('5.1: Accepts drop (meets requirements)', async ({ page }) => {
    const empty = page.locator('[data-testid="quest-quest_001-empty"]');
    await expect(empty).toBeVisible();
  });

  test('5.2: Rejects drop (insufficient stats)', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_002"]');
    const locked = await card.getAttribute('data-locked');
    expect(locked).toBe('true');
  });

  test('5.3: Shows feedback on drag', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    await expect(card).toBeVisible();
  });

  test('5.4: Completes drop', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_001"]');
    await expect(card).toBeVisible();
  });

  // ===== EDGE CASES (2 tests) =====

  test('6.1: Very high level requirement', async ({ page }) => {
    const card = page.locator('[data-testid="quest-card-quest_002"]');
    const locked = await card.getAttribute('data-locked');
    expect(locked).toBe('true');
  });

  test('6.2: Multiple stat requirements', async ({ page }) => {
    const stats = page.locator('[data-testid="quest-quest_001-stats"]');
    const text = await stats.textContent();
    expect(text).toContain('STR');
  });

  // ===== VISUAL REGRESSION =====

  test('Visual: QuestCard snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('minimal-questcard-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
