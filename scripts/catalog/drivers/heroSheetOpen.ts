/**
 * Catalog driver: open the hero sheet via the roster rail's hover intent —
 * `p`/clicks do not open it (pointerDownCapture cancels click intent; `p`
 * needs a populated rail). The driver opens the roster stage panel, hovers
 * the first resident card and waits out the intent delay. Verifies via
 * `#hero-sheet`.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

/** Drive the app into the "hero sheet open" state. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  const { page } = ctx;
  if (await page.locator('#hero-sheet').isVisible().catch(() => false)) return true;
  if (!(await page.getByTestId('resident-roster-panel').isVisible().catch(() => false))) {
    await page.keyboard.press('r');
  }
  await page.getByTestId('resident-roster-panel').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(800); // rail mounts cards async
  const card = page.locator('[data-resident-id]').first();
  if ((await card.count()) === 0) return false;
  /* Hover intent: cardEnter → machine 'intending' → open after the config
   * delay. Re-hover between polls in case pointerover missed the wrapper. */
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await page.locator('#hero-sheet').isVisible().catch(() => false)) return true;
    await card.hover().catch(() => undefined);
    await page.waitForTimeout(600);
  }
  return false;
}
