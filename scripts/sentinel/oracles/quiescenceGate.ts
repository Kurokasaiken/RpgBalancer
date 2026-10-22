/**
 * quiescenceGate — visual-quiescence gate for Pass-2 oracles (PLAN-078 T-002).
 *
 * A state counts as quiescent when every visible HUD/stage surface's
 * bounding rect is stable below `rectDeltaPx` for `consecutiveTicks`
 * consecutive rAF ticks, after `postGestureDebounceMs` has elapsed since
 * the last input. A timeout is itself a finding (`never_quiesced`) and the
 * last frame is still audited in degraded mode.
 */
import type { HarnessCtx } from '../gameSurfaceHarness';
import type { SentinelConfig } from '../sentinelConfig';

export interface QuiescenceResult {
  quiesced: boolean;
  /** Worst rect delta observed on the last probe (px). */
  lastDeltaPx: number;
  waitedMs: number;
  /** Element path of the mover when never-quiescing (best effort). */
  offender?: string;
}

const SURFACE_SEL =
  '[data-hud-panel],[data-stage-panel],[data-skin="hud-plaque"],[role="dialog"],[role="tooltip"],[data-testid="quest-check-column"],[data-testid="village-registry-list"],[data-testid="quest-window"]';

/**
 * One in-page probe: samples all surface rects now and after `ticks` rAF
 * frames; returns the largest delta and a label for the worst mover.
 */
function probeOnce(page: HarnessCtx['page'], ticks: number) {
  return page.evaluate(async ({ sel, ticks }) => {
    const grab = () => {
      /* Key by (label, DOM index): attribute values like data-skin="hud-plaque"
       * are shared by EVERY plaque — keying on the raw attribute collapsed N
       * surfaces into one Map entry and only the last rect survived, hiding
       * a mover on any earlier sibling (found by T-003 calibration). */
      const rects = new Map<string, [number, number, number, number]>();
      document.querySelectorAll(sel).forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        const label =
          el.getAttribute('data-testid') ||
          el.getAttribute('data-hud-panel') ||
          el.getAttribute('data-stage-panel') ||
          el.getAttribute('data-skin') ||
          el.tagName;
        rects.set(`${label}#${i}`, [r.x, r.y, r.width, r.height]);
      });
      return rects;
    };
    const before = grab();
    for (let i = 0; i < ticks; i++) {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }
    const after = grab();
    let worst = 0;
    let offender: string | undefined;
    for (const [k, a] of after) {
      const b = before.get(k);
      if (!b) continue;
      const d = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]), Math.abs(a[3] - b[3]));
      if (d > worst) {
        worst = d;
        offender = k.replace(/#\d+$/, '');
      }
    }
    return { worst, offender };
  }, { sel: SURFACE_SEL, ticks });
}

/**
 * Waits for visual quiescence. Never throws — a timeout returns
 * `{quiesced:false}` so the caller records `never_quiesced` and audits the
 * last frame in degraded mode.
 */
export async function awaitQuiescence(
  ctx: HarnessCtx,
  cfg: SentinelConfig['quiescence'],
  { postGestureAt }: { postGestureAt?: number } = {},
): Promise<QuiescenceResult> {
  const started = Date.now();
  const debounceLeft = postGestureAt ? postGestureAt + cfg.postGestureDebounceMs - started : 0;
  if (debounceLeft > 0) await ctx.page.waitForTimeout(debounceLeft);

  let last: { worst: number; offender?: string } = { worst: Infinity };
  while (Date.now() - started < cfg.timeoutMs) {
    last = await probeOnce(ctx.page, cfg.consecutiveTicks);
    if (last.worst < cfg.rectDeltaPx) {
      return { quiesced: true, lastDeltaPx: last.worst, waitedMs: Date.now() - started };
    }
  }
  return {
    quiesced: false,
    lastDeltaPx: last.worst,
    waitedMs: Date.now() - started,
    offender: last.offender,
  };
}
