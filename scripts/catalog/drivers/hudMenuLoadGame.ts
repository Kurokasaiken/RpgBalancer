/**
 * Catalog driver: open the in-game HUD menu (hud-menu-trigger) and pick the
 * "Load game" session entry — second `role="menuitem"` of the session block
 * (saveNow, loadGame, memorial, quit, settings). Verifies via
 * `data-testid="load-game-panel"`, never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "load game dialog open" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  const trigger = page.getByTestId('hud-menu-trigger');
  /* Same boot/reveal race as hudMenuMemorial: the trigger mounts before it
   * is actionable — wait for visibility rather than letting click()'s
   * retries time out and throw. */
  try {
    await trigger.waitFor({ state: 'visible', timeout: 30_000 });
  } catch {
    return false;
  }
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  await page.locator('[role="menu"]').waitFor({ state: 'visible', timeout: 5_000 });
  await page.locator('[role="menu"] [role="menuitem"]').nth(1).click();
  try {
    await page.getByTestId('load-game-panel').waitFor({ state: 'visible', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
