/**
 * Catalog driver: surface the HUD control tooltip by hovering a corner
 * control (`hud-hide-toggle`, wrapped in HudTooltip) — the radix tooltip
 * mounts after the 350 ms delay. Verifies via `data-hud-tooltip`,
 * never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "HUD control tooltip open" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  await page.getByTestId('hud-hide-toggle').hover();
  try {
    await page.locator('[data-hud-tooltip]').first().waitFor({ state: 'visible', timeout: 4_000 });
    return true;
  } catch {
    return false;
  }
}
