/**
 * Catalog driver: open the legacy reliquary via the Director panel
 * (`d` shortcut → `[data-action-id="legacy"]`, PLAN-067 T-C4). Verifies via
 * `data-testid="legacy-reliquary"`.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "legacy reliquary open" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  if (!(await page.getByTestId('director-panel').isVisible().catch(() => false))) {
    await page.keyboard.press('d');
    /* Fallback when the key is swallowed by an open view/dialog: Panels
     * menu → Director entry (5th listed panel: Roster, Events, Village
     * stash, Merchant, Director, Tuning). */
    const ok = await page.getByTestId('director-panel').waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false);
    if (!ok) {
      await page.locator('[data-hud-panels-trigger]').click();
      await page.locator('[role="menu"]').waitFor({ state: 'visible', timeout: 5_000 });
      await page.locator('[role="menu"] [role="menuitemcheckbox"]').nth(4).click();
    }
  }
  await page.getByTestId('director-panel').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('[data-action-id="legacy"]').click();
  try {
    await page.getByTestId('legacy-reliquary').waitFor({ state: 'visible', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
