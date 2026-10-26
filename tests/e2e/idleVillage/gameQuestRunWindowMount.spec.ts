/**
 * gameQuestRunWindowMount.spec.ts — R-247 regression: the quest run window
 * mounts on `/game` through the canonical `expedition demoLaunch` hook.
 *
 * Bug it guards: `QuestRunWindow` read `node` and `vwU` before their `const`
 * declarations in the same render (a temporal-dead-zone ReferenceError). Every
 * render of the window threw, the ErrorBoundary took the route, and the quest
 * run was unreachable from the catalog driver and the sentinel harness. The
 * fault is in the component body, not an import cycle, so only a real mount
 * through the run path catches it.
 */
import { test, expect, type Page } from '@playwright/test';

const POI = 'poi-goblin';

interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    revealQuestPois?: () => void;
  };
}

const demoLaunch = (page: Page) =>
  page.evaluate((poiId) => {
    const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[poiId];
    if (!exp || typeof exp.demoLaunch !== 'function') throw new Error('expedition demoLaunch hook missing');
    exp.demoLaunch();
  }, POI);

test.describe('R-247 — quest run window mounts via demoLaunch', () => {
  test('demoLaunch reaches the quest run window without a render error', async ({ page }) => {
    const renderErrors: string[] = [];
    page.on('pageerror', (err) => {
      if (/before initialization/.test(err.message)) renderErrors.push(err.message);
    });

    await page.goto('/game');
    await page.waitForFunction(
      (poiId) => Boolean((window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[poiId]),
      POI,
      { timeout: 30_000 },
    );
    await page.evaluate(() => (window as TestHooksWindow).__idleVillageTestHooks?.revealQuestPois?.());
    await demoLaunch(page);

    await expect(page.locator('[data-testid="quest-window"]')).toBeVisible({ timeout: 20_000 });
    expect(renderErrors).toEqual([]);
  });
});
