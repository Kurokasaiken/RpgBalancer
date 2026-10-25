/**
 * Catalog driver: open the settings dialog from the title screen —
 * `?title=1` → Settings pill → `settings-panel`. Verifies via testid.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';
import { drive as showTitle } from './titleScreen';

/** Drive the app into the "settings panel on title" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  if (!(await page.getByTestId('title-screen').isVisible().catch(() => false))) {
    if (!(await showTitle(ctx))) return false;
  }
  /* Title buttons: [continue]?, new game, load, settings, [exit]? — settings
   * is the last-or-second-to-last pill; pick by position from the end. */
  const buttons = page.getByTestId('title-screen').locator('button');
  const n = await buttons.count();
  for (const i of [n - 1, n - 2]) {
    await buttons.nth(i).click().catch(() => undefined);
    const ok = await page.getByTestId('settings-panel').waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false);
    if (ok) return true;
    if (!(await page.getByTestId('title-screen').isVisible().catch(() => false))) return false;
  }
  return false;
}
