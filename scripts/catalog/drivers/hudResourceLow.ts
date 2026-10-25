/**
 * Catalog driver: advance canonical ticks until food is depleted
 * (the consumption path turns the resource tab into its warning
 * visual). Verifies via the `getVillageResources` test hook —
 * never a blind sleep.
 */
import type { HarnessCtx } from '../../sentinel/gameSurfaceHarness';

interface Hooks {
  advanceTicks?: (n: number) => void;
  getVillageResources?: () => { gold?: number; food?: number; wood?: number; xp?: number };
}

async function food(ctx: HarnessCtx): Promise<number> {
  const res = (await ctx.page.evaluate(() => {
    const h = (window as { __idleVillageTestHooks?: Hooks }).__idleVillageTestHooks;
    return h?.getVillageResources?.() ?? null;
  })) as { food?: number } | null;
  return res?.food ?? Number.POSITIVE_INFINITY;
}

/** Drive the app into the "resource-low" HUD state (food ≤ 0). */
export async function drive(ctx: HarnessCtx): Promise<boolean> {
  for (let i = 0; i < 30; i++) {
    if ((await food(ctx)) <= 0) return true;
    await ctx.page.evaluate(() => {
      const h = (window as { __idleVillageTestHooks?: Hooks }).__idleVillageTestHooks;
      h?.advanceTicks?.(10);
    });
    await ctx.page.waitForTimeout(250);
  }
  return (await food(ctx)) <= 0;
}
