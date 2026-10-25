/**
 * Catalog driver: surface the map region name-plate by resting the pointer
 * on painted territory on the Pixi canvas (`regionHoverDelayS` ≈ 1 s dwell
 * before `regionHover` mounts the plate). Sweeps viewport points until a
 * `[role="tooltip"]` plaque that is not the HUD control tooltip
 * (`data-hud-tooltip`) appears. Returns false if no land is hit — honest
 * unreachable, never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

const TOOLTIP = '[role="tooltip"]:not([data-hud-tooltip])';

/** Drive the app into the "region tooltip on map" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  const seen = () => page.locator(TOOLTIP).first().isVisible().catch(() => false);
  for (let y = 140; y < 760; y += 140) {
    for (let x = 160; x < 1300; x += 190) {
      await page.mouse.move(x, y);
      /* The name plate only mounts after the pointer rests ~1 s on a
       * territory — poll through the dwell instead of moving on. */
      const deadline = Date.now() + 1500;
      while (Date.now() < deadline) {
        if (await seen()) return true;
        await page.waitForTimeout(150);
      }
    }
  }
  return false;
}
