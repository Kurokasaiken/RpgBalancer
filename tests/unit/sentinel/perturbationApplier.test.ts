/**
 * PLAN-078 regression — LIFECYCLE_INTERRUPT must wait for the app's
 * test-hook surface to remount after page.reload() before re-reaching
 * the node. Without it, hook-assisted reaches (S6+) silently no-op on
 * optional-chained evaluate calls and the run dies on a waitVisible
 * timeout (fatal race, reproduced 2026-10-23).
 */
import { describe, it, expect } from 'vitest';
import { applyPerturbation } from '../../../scripts/sentinel/perturbationApplier';
import { DEFAULT_SENTINEL_CONFIG } from '../../../scripts/sentinel/sentinelConfig';
import type { HarnessCtx, SurfaceNode } from '../../../scripts/sentinel/gameSurfaceHarness';

function mkCtx(events: string[]): HarnessCtx {
  return {
    steps: [],
    page: {
      reload: async () => {
        events.push('reload');
      },
      waitForFunction: async () => {
        events.push('waitForHooks');
        return undefined;
      },
      locator: () => ({
        first: () => ({ waitFor: async () => events.push('waitReadySignal') }),
      }),
    },
  } as unknown as HarnessCtx;
}

const mkNode = (events: string[]): SurfaceNode => ({
  id: 'S6_QuestPlanner',
  readySignal: '[data-testid="quest-expedition-detail"]',
  reach: async () => {
    events.push('reach');
  },
  perturbations: ['LIFECYCLE_INTERRUPT'],
});

describe('applyPerturbation — LIFECYCLE_INTERRUPT', () => {
  it('waits for the test-hook surface after reload before re-reaching', async () => {
    const events: string[] = [];
    await applyPerturbation(mkCtx(events), mkNode(events), 'LIFECYCLE_INTERRUPT', DEFAULT_SENTINEL_CONFIG);
    expect(events).toEqual(['reload', 'waitForHooks', 'reach', 'waitReadySignal']);
  });

  it('still re-reaches when the hook surface never appears', async () => {
    const events: string[] = [];
    const ctx = mkCtx(events);
    ctx.page.waitForFunction = (() =>
      new Promise((_res, rej) => rej(new Error('timeout')))) as unknown as HarnessCtx['page']['waitForFunction'];
    await applyPerturbation(ctx, mkNode(events), 'LIFECYCLE_INTERRUPT', DEFAULT_SENTINEL_CONFIG);
    expect(events).toEqual(['reload', 'reach', 'waitReadySignal']);
  });

  it('prefers node.resume over node.reach after reload (quest-run recovery)', async () => {
    const events: string[] = [];
    const node = mkNode(events);
    node.resume = async () => {
      events.push('resume');
    };
    await applyPerturbation(mkCtx(events), node, 'LIFECYCLE_INTERRUPT', DEFAULT_SENTINEL_CONFIG);
    expect(events).toEqual(['reload', 'waitForHooks', 'resume', 'waitReadySignal']);
  });
});
