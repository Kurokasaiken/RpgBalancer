/**
 * Catalog driver: run the quest to its end (real Enter/clicks + advanceTicks,
 * motion on) so the in-window epilogue and «who came back» are mounted.
 */
import { surfaceNode, runToSettlement, type HarnessCtx } from '../../sentinel/gameSurfaceHarness';

export async function drive(ctx: HarnessCtx): Promise<boolean> {
  await ctx.page.emulateMedia({ reducedMotion: 'no-preference' });
  await surfaceNode('S7_QuestJourneyOutbound').reach(ctx);
  const r = await runToSettlement(ctx);
  return r.ended;
}
