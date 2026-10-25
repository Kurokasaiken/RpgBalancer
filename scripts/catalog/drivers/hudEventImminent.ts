/**
 * Catalog driver: surface the HUD "next event" tab
 * (`data-testid="hud-next-tab"`). The tab lists dated events: the
 * invasion countdown and revealed quest offers — `revealQuestPois` is
 * the declared E2E seam for «Mostra quest», `startInvasion` the seam
 * for the goblin-invasion countdown.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

interface Hooks {
  advanceTicks?: (n: number) => void;
  revealQuestPois?: () => void;
  startInvasion?: () => void;
}

async function tabVisible(ctx: HarnessCtx): Promise<boolean> {
  return ctx.page.locator('[data-testid="hud-next-tab"]').first().isVisible().catch(() => false);
}

async function call(ctx: HarnessCtx, name: 'advanceTicks' | 'revealQuestPois' | 'startInvasion', arg?: number): Promise<void> {
  await ctx.page.evaluate(
    ({ n, a }) => {
      const h = (window as { __idleVillageTestHooks?: Record<string, ((x?: number) => void) | undefined> }).__idleVillageTestHooks;
      h?.[n]?.(a);
    },
    { n: name, a: arg },
  );
}

/** Drive the app until the next-event tab renders. */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    if (await tabVisible(ctx)) return true;
    await call(ctx, 'advanceTicks', 10);
    await ctx.page.waitForTimeout(300);
  }
  await call(ctx, 'revealQuestPois');
  await ctx.page.waitForTimeout(800);
  if (await tabVisible(ctx)) return true;
  await call(ctx, 'startInvasion');
  await ctx.page.waitForTimeout(800);
  return tabVisible(ctx);
}
