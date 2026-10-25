/**
 * Catalog driver: open the in-game HUD menu (hud-menu-trigger) and pick the
 * "Memorial" session entry — third `role="menuitem"` of the session block.
 * Verifies via `data-testid="memorial-panel"`, never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "memorial panel open" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  const trigger = page.getByTestId('hud-menu-trigger');
  /* The trigger mounts while the boot/reveal phase still hides it — wait
   * for actionability instead of letting click()'s own retries burn the
   * whole 30s and throw (observed flake, PLAN-086 memorial-panel run 1). */
  try {
    await trigger.waitFor({ state: 'visible', timeout: 30_000 });
  } catch {
    return false;
  }
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  await page.locator('[role="menu"]').waitFor({ state: 'visible', timeout: 5_000 });
  await page.locator('[role="menu"] [role="menuitem"]').nth(2).click();
  try {
    await page.getByTestId('memorial-panel').waitFor({ state: 'visible', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
