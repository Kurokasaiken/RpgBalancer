/**
 * Catalog driver: open the load-game dialog from the title screen —
 * `?title=1` → Load Game pill → `load-game-panel`. Verifies via testid.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';
import { drive as showTitle } from './titleScreen';

/** Drive the app into the "load game panel on title" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  if (!(await page.getByTestId('title-screen').isVisible().catch(() => false))) {
    if (!(await showTitle(ctx))) return false;
  }
  /* Title buttons: [continue]?, new game, load, settings — load sits before
   * settings; probe the middle pills. */
  const buttons = page.getByTestId('title-screen').locator('button');
  const n = await buttons.count();
  for (const i of [n - 2, n - 3, n - 1]) {
    if (i < 0) continue;
    await buttons.nth(i).click().catch(() => undefined);
    const ok = await page.getByTestId('load-game-panel').waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false);
    if (ok) return true;
    if (!(await page.getByTestId('title-screen').isVisible().catch(() => false))) return false;
  }
  return false;
}
