/**
 * Catalog drivers (PLAN-086, R-282): the quest run window's companion plaques
 * and the Amanuense folio. Launch is hook-assisted (`demoLaunch`, via the
 * S7 node); opening a plaque is a real click on its header toggle.
 */
import { surfaceNode, advanceTicks, type HarnessCtx } from '../../sentinel/gameSurfaceHarness';

const visible = (ctx: HarnessCtx, sel: string) => ctx.page.locator(sel).first().isVisible().catch(() => false);

export async function openCompanion(ctx: HarnessCtx, label: string, readySel: string): Promise<boolean> {
  if (!(await visible(ctx, '[data-testid="quest-window"]'))) await surfaceNode('S7_QuestJourneyOutbound').reach(ctx);
  if (await visible(ctx, readySel)) return true;
  await ctx.page.getByRole('button', { name: label }).first().click();
  await ctx.page.locator(readySel).first().waitFor({ state: 'visible', timeout: 6000 }).catch(() => undefined);
  return visible(ctx, readySel);
}

/** The folio exists only on nodes with a long-form page, reached through
 *  narrative beats — which need motion (reduced-motion drains the beat queue). */
export async function openAmanuense(ctx: HarnessCtx): Promise<boolean> {
  await ctx.page.emulateMedia({ reducedMotion: 'no-preference' });
  if (!(await visible(ctx, '[data-testid="quest-window"]'))) await surfaceNode('S7_QuestJourneyOutbound').reach(ctx);
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (await visible(ctx, '[data-testid="amanuense-open"]')) {
      await ctx.page.getByTestId('amanuense-open').click();
      await ctx.page.getByTestId('amanuense-page').waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
      return visible(ctx, '[data-testid="amanuense-page"]');
    }
    if (await visible(ctx, '[data-testid="quest-window-beat"]')) await ctx.page.keyboard.press('Enter');
    else if (await visible(ctx, '[data-testid="quest-window-choice"]:not([disabled])')) {
      await ctx.page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().click();
    } else await advanceTicks(ctx, 2);
    await ctx.page.waitForTimeout(250);
  }
  return false;
}
