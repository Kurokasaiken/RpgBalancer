/**
 * Catalog driver: open the bottom-right "Panels" dropdown by clicking
 * its real trigger (`[data-hud-panels-trigger]`). Verifies via the
 * trigger's own `aria-expanded` — never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "panels-open" HUD state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const trigger = ctx.page.locator('[data-hud-panels-trigger]').first();
  if ((await trigger.count()) === 0) return false;
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
    await trigger.click();
  }
  try {
    await ctx.page.waitForFunction(
      () => document.querySelector('[data-hud-panels-trigger]')?.getAttribute('aria-expanded') === 'true',
      undefined,
      { timeout: 3000 },
    );
    return true;
  } catch {
    return false;
  }
}
