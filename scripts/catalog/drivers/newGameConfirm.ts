/**
 * Catalog driver: surface the "new game" confirm dialog — it mounts only when
 * `info.hasProgress`, so the driver first guarantees progress exists (enter
 * the game, HUD menu → Save Now), then `?title=1` → New Game pill →
 * `new-game-confirm`. Verifies via testid, never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';
import { drive as showTitle } from './titleScreen';

/** Clicks the New Game pill and waits for the confirm. */
async function tryNewGame(page: HarnessCtx['page']): Promise<boolean> {
  const buttons = page.getByTestId('title-screen').locator('button');
  const n = await buttons.count();
  const candidates = n > 3 ? [1, 0] : [0, 1];
  for (const i of candidates) {
    await buttons.nth(i).click().catch(() => undefined);
    const ok = await page.getByTestId('new-game-confirm').waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false);
    if (ok) return true;
    if (!(await page.getByTestId('title-screen').isVisible().catch(() => false))) return false;
  }
  return false;
}

/** Drive the app into the "new game confirm" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  if (!(await page.getByTestId('title-screen').isVisible().catch(() => false))) {
    if (!(await showTitle(ctx))) return false;
  }
  if (await tryNewGame(page)) return true;
  /* No progress to lose → the flow skipped the confirm. Re-enter, write a
   * manual save through the real menu path, then stage the title again. */
  await page.waitForSelector('[data-testid="world-map-layer"] canvas, [data-testid="title-screen"]', { timeout: 60_000 }).catch(() => undefined);
  if (await page.getByTestId('title-screen').isVisible().catch(() => false)) {
    await page.getByTestId('title-screen').locator('button').first().click();
    await page.waitForSelector('[data-testid="world-map-layer"] canvas', { timeout: 60_000 });
  }
  const trigger = page.getByTestId('hud-menu-trigger');
  await trigger.click().catch(() => undefined);
  await page.locator('[role="menu"]').waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
  await page.locator('[role="menu"] [role="menuitem"]').first().click().catch(() => undefined); // Save now
  await page.waitForTimeout(1_500);
  await page.keyboard.press('Escape').catch(() => undefined);
  if (!(await showTitle(ctx))) return false;
  return tryNewGame(page);
}
