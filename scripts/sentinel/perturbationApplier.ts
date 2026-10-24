/**
 * perturbationApplier — applies the in-state perturbation operators to a
 * reached surface node (PLAN-078 Layer A).
 *
 * Operators (v1, all deterministic and recorded in `ctx.steps`):
 *  - `VP_SWEEP` / `LOCALE_SWEEP`: cell-level — applied by the controller
 *    through openGame()/setLocale(), so `applyPerturbation` is a no-op for
 *    them (the perturbation IS the cell);
 *  - `LIFECYCLE_INTERRUPT`: mid-state reload — `page.reload()` then re-reach
 *    the node, verifying the ready signal re-hydrates. This is the only
 *    interrupt exercised identically on every node (minimize/close affordances
 *    are panel-specific and would need per-node choreography);
 *  - `SOAK_CYCLE`: `soakIterations`× mount/unmount between the node and the
 *    world-map idle state — the T-000 texture-pool leak pattern.
 */
import type { HarnessCtx, SurfaceNode } from './gameSurfaceHarness';
import { surfaceNode } from './gameSurfaceHarness';
import type { PerturbationKind, SentinelConfig } from './sentinelConfig';

/** Result of applying a perturbation — timing anchors for the oracles. */
export interface PerturbationResult {
  applied: boolean;
  /** Timestamp of the last gesture/reload — post-gesture debounce anchor. */
  postGestureAt?: number;
  note?: string;
}

/**
 * Applies `kind` to the currently-mounted `node`. The cell-level operators
 * (`VP_SWEEP`, `LOCALE_SWEEP`) return `applied: true` immediately — they are
 * identities at node scope.
 */
export async function applyPerturbation(
  ctx: HarnessCtx,
  node: SurfaceNode,
  kind: PerturbationKind,
  cfg: SentinelConfig,
): Promise<PerturbationResult> {
  switch (kind) {
    case 'VP_SWEEP':
    case 'LOCALE_SWEEP':
      return { applied: true };

    case 'LIFECYCLE_INTERRUPT': {
      ctx.steps.push({ step: `${node.id}:perturb`, how: 'input-reale:reload-mid-state' });
      await ctx.page.reload({ waitUntil: 'domcontentloaded' });
      const postGestureAt = Date.now();
      /* After reload the app's test-hook surface remounts asynchronously.
       * Hook-assisted reaches call it through optional chaining, so
       * reaching before the mount silently no-ops (S6 fatal race). */
      await ctx.page
        .waitForFunction(() => Boolean(window.__idleVillageTestHooks), undefined, { timeout: 30_000 })
        .catch(() => {});
      await (node.resume ? node.resume(ctx, node) : node.reach(ctx));
      await ctx.page.locator(node.readySignal).first().waitFor({ state: 'visible', timeout: 30_000 });
      return { applied: true, postGestureAt, note: 'reload-mid-state' };
    }

    case 'SOAK_CYCLE': {
      const map = surfaceNode('S1_WorldMapIdle');
      for (let i = 0; i < cfg.soakIterations; i++) {
        await map.reach(ctx);
        await node.reach(ctx);
      }
      ctx.steps.push({ step: `${node.id}:perturb`, how: `soak:${cfg.soakIterations}x mount/unmount` });
      return { applied: true, note: `soak x${cfg.soakIterations}` };
    }
  }
}
