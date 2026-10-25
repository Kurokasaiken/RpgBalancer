/**
 * Catalog driver: pin the village building tooltip — Village view → registry
 * open → click the warehouse registry row (the canonical pinned-tooltip
 * affordance while the drawer is open, R-270). Verifies via the tooltip
 * testid, never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "village building tooltip pinned" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  if (!(await page.getByTestId('village-screen-view').isVisible().catch(() => false))) {
    await page.locator('[data-nav-id="village"]').click();
  }
  await page.getByTestId('village-screen-view').waitFor({ state: 'visible', timeout: 15_000 });
  if (!(await page.getByTestId('village-registry').isVisible().catch(() => false))) {
    await page.getByTestId('village-registry-chip').click().catch(() => undefined);
  }
  await page.getByTestId('village-registry').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  await page.locator('[data-registry-row="warehouse"]').click().catch(() => undefined);
  try {
    await page.getByTestId('village-building-tooltip').waitFor({ state: 'visible', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
