/**
 * PLAN-033 — event theatre clock freeze (Director, 2026-10-12): while the shroud
 * closes over the map and the announcement card sits at its peak, the game clock
 * is frozen; once the curtains have fully reopened it returns to exactly the
 * state it was frozen from — paused stays paused, 2x resumes at 2x. And the
 * theatre calls a hidden HUD back: the world asking for attention.
 */
import { expect, test, type Page } from '@playwright/test';

type ClockSnapshot = { isPaused: boolean; speedMultiplier: number; currentTick: number; currentDay: number };
type HooksWindow = Window & {
  __idleVillageTestHooks?: {
    startInvasion?: () => void;
    getClock?: () => ClockSnapshot;
  };
};

const clock = (page: Page): Promise<ClockSnapshot | null> =>
  page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.getClock?.() ?? null);

test.describe('event theatre', () => {
  test.use({ locale: 'en-US' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/game?capture=1');
    await page.waitForFunction(
      () => {
        const h = (window as HooksWindow).__idleVillageTestHooks;
        return Boolean(h?.startInvasion && h?.getClock);
      },
      { timeout: 30_000 },
    );
  });

  test('freezes the clock while the curtains play, restores running at the same speed', async ({ page }) => {
    await page.keyboard.press('2');
    await expect.poll(async () => (await clock(page))?.speedMultiplier).toBe(2);

    await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion?.());
    const card = page.getByTestId('world-event-card-body');
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect.poll(async () => (await clock(page))?.isPaused).toBe(true);

    // The frozen theatre ticks no tick…
    const t1 = (await clock(page))!.currentTick;
    await page.waitForTimeout(1_400);
    expect((await clock(page))!.currentTick).toBe(t1);
    // …and the player's own inputs can't unpause under the curtains.
    await page.keyboard.press('Space');
    expect((await clock(page))!.isPaused).toBe(true);

    await card.getByRole('button').click();
    // Curtains reopen (~0.9s) then the hold releases (~1s tail).
    await expect.poll(async () => (await clock(page))?.isPaused, { timeout: 10_000 }).toBe(false);
    expect((await clock(page))!.speedMultiplier).toBe(2);
    await expect.poll(async () => (await clock(page))!.currentTick, { timeout: 10_000 }).toBeGreaterThan(t1);
  });

  test('a clock paused before the theatre stays paused after', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect.poll(async () => (await clock(page))?.isPaused).toBe(true);

    await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion?.());
    const card = page.getByTestId('world-event-card-body');
    await expect(card).toBeVisible({ timeout: 10_000 });
    expect((await clock(page))!.isPaused).toBe(true);

    await card.getByRole('button').click();
    await page.waitForTimeout(2_000);
    expect((await clock(page))!.isPaused).toBe(true);
  });

  test('the theatre calls a hidden HUD back', async ({ page }) => {
    await page.keyboard.press('h');
    await expect(page.locator('.game-frame[data-hud-hidden]')).toHaveCount(1);

    await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.startInvasion?.());
    await expect(page.locator('.game-frame[data-hud-hidden]')).toHaveCount(0);
    await expect(page.getByTestId('world-event-card-body')).toBeVisible({ timeout: 10_000 });
  });
});
