/**
 * Catalog driver: open the in-game settings dialog — HUD menu trigger → the
 * last `role="menuitem"` (Settings). Verifies via `settings-panel`.
 *
 * Also survives starting from the title screen: after a `?title=1` state the
 * game is not mounted at all (GameEntry phase 'title' — `hud-menu-trigger`
 * does not exist), so the driver first dismisses any open dialog and enters
 * through the title screen's entry button (input-reale), then waits out the
 * boot overlay before reaching for the trigger.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';
import { waitBootCleared } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "in-game settings panel" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  if (await page.getByTestId('title-screen').isVisible().catch(() => false)) {
    const openDialog = page.locator('[role="dialog"]').first();
    if (await openDialog.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      if (await openDialog.isVisible().catch(() => false)) {
        await openDialog.getByRole('button').first().click().catch(() => undefined);
      }
    }
    /* First pill = Continue when a save exists, otherwise Nuova partita
     * (openGame's own 'input-reale:title-continue' convention). */
    await page.getByTestId('title-screen').locator('button').first().click();
    const confirm = page.getByTestId('new-game-confirm');
    if (await confirm.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirm.locator('button').last().click().catch(() => undefined);
    }
    await waitBootCleared(ctx);
  }
  const trigger = page.getByTestId('hud-menu-trigger');
  try {
    await trigger.waitFor({ state: 'visible', timeout: 30_000 });
  } catch {
    return false;
  }
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  await page.locator('[role="menu"]').waitFor({ state: 'visible', timeout: 5_000 });
  await page.locator('[role="menu"] [role="menuitem"]').last().click();
  try {
    await page.getByTestId('settings-panel').waitFor({ state: 'visible', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
