/**
 * Catalog driver: click the VILLAGE nav item so the bottom nav bar shows
 * its active/pressed state on the village surface (`/game` owns the
 * selection via `activeNavId={viewMode}` — the click is the real seam,
 * not a store poke). Verifies via `aria-pressed`, never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "nav: VILLAGE active" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const btn = ctx.page.locator('nav [data-nav-id="village"]').first();
  if (!(await btn.isVisible().catch(() => false))) return false;
  await btn.click();
  try {
    await ctx.page.waitForSelector('nav [data-nav-id="village"][aria-pressed="true"]', { timeout: 6000 });
    /* Let the village surface settle (plaque slides/paints) before the shot. */
    await ctx.page.waitForTimeout(600);
    return true;
  } catch {
    return false;
  }
}
