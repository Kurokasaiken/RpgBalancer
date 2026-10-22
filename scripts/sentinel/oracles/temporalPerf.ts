/**
 * temporalPerf — Pass-1 zero-pixel oracle (PLAN-078 T-002).
 *
 * Installs an in-page rAF sampler via `addInitScript` that records, without
 * ever touching pixels:
 *  - per-frame rAF deltas (frame-time histogram for p95 jitter / long tasks);
 *  - `PerformanceObserver('longtask')` entries during interactions (T-08);
 *  - (headingText, activeImageSrc) pairs each frame during quest-node
 *    transitions — a mixed pair (heading_B, img_A) is the T-A3 desync;
 *  - `document.getAnimations()` running count vs `data-astro-idle`/`paused`
 *    (BV-04: animation alive in a parked/paused surface);
 *  - post-pointerup rect bounce of drag-proxy/medallion elements (T-A6,
 *    R-257 ghost/stale snap).
 *
 * `evaluateTemporalPerf` is a pure function over the collected samples —
 * fully unit-testable without a browser.
 */
import type { HarnessCtx } from '../gameSurfaceHarness';
import type { SentinelConfig } from '../sentinelConfig';
import type { OracleFinding, AuditPerturbation } from './index';

export interface FrameSample {
  t: number;
  deltaMs: number;
  runningAnimations: number;
  astroIdle: string | null;
  heading: string | null;
  activeImg: string | null;
}

export interface LongTaskSample {
  startTime: number;
  duration: number;
}

export interface DragProbe {
  /** Element identifier (testid/aria) whose post-pointerup rect was tracked. */
  id: string;
  /** Rects sampled during the post-release window. */
  rects: [number, number, number, number][];
  /** Pre-drag rect (captured at pointerdown on the source). */
  preDrag?: [number, number, number, number];
}

export interface TemporalPerfSamples {
  frames: FrameSample[];
  longTasks: LongTaskSample[];
  drags: DragProbe[];
}

declare global {
  interface Window {
    __sentinelPerf?: {
      frames: FrameSample[];
      longTasks: LongTaskSample[];
      drags: DragProbe[];
      sampling: boolean;
      _raf?: number;
      _last?: number;
      _drag?: { pre: [number, number, number, number]; targets: string[] };
    };
  }
}

const HEADING_SEL =
  '[data-testid="quest-window-stage"] h1, [data-testid="quest-window-stage"] h2, [data-testid="quest-window"] [data-testid*="title" i], [data-testid="quest-theatre"] [class*="title" i]';
const ART_SEL = '[data-testid="quest-theatre"] img, [data-testid="quest-window-stage"] img, [data-hud-panel] canvas';
const DRAG_SEL =
  '[data-testid*="medal" i], [data-testid*="ghost" i], [data-testid*="proxy" i], [data-dnd-kit-drag-overlay], .dnd-drag-overlay, [data-drag-overlay]';

/**
 * In-page installer as RAW SOURCE. tsx/esbuild wraps serialized functions in
 * `__name(...)` (keepNames) which does not exist in the page context — the
 * probe crashed with `__name is not defined` under `npx tsx`. A string is
 * bundler-proof; it is invoked with `(args)` appended by the caller.
 */
const INSTALLER_SRC = `((SELS) => {
  const bag = (window.__sentinelPerf ??= { frames: [], longTasks: [], drags: [], sampling: false });
  const headingOf = () => (document.querySelector(SELS.HEADING_SEL)?.textContent ?? '').trim() || null;
  const imgOf = () => {
    const el = document.querySelector(SELS.ART_SEL);
    return el ? el.currentSrc || el.src || 'canvas' : null;
  };
  const tick = () => {
    if (!bag.sampling) return;
    const now = performance.now();
    bag.frames.push({
      t: now,
      deltaMs: bag._last ? now - bag._last : 0,
      runningAnimations: document.getAnimations().filter((a) => a.playState === 'running').length,
      astroIdle: document.querySelector('[data-astro-idle]')?.getAttribute('data-astro-idle') ?? null,
      heading: headingOf(),
      activeImg: imgOf(),
    });
    if (bag._drag && now - bag._drag.startT < 600) {
      bag._drag.targets.forEach((id, i) => {
        const el = document.querySelector('[data-testid="' + id + '"]');
        if (!el) return;
        const r = el.getBoundingClientRect();
        (bag.drags[i] ??= { id, rects: [] }).rects.push([r.x, r.y, r.width, r.height]);
      });
    }
    bag._last = now;
    bag._raf = requestAnimationFrame(tick);
  };
  /* NO 'buffered: true' — buffered entries would re-report page-load long
   * tasks inside every audit window (the clean-map false positive). Only
   * long tasks that START during the sampling window count. */
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) bag.longTasks.push({ startTime: e.startTime, duration: e.duration });
  }).observe({ type: 'longtask' });
  document.addEventListener('pointerup', (ev) => {
    const hit = document.elementFromPoint(ev.clientX, ev.clientY);
    const drag = hit?.closest(SELS.DRAG_SEL) ?? document.querySelector(SELS.DRAG_SEL);
    const ids = new Set();
    if (drag?.getAttribute('data-testid')) ids.add(drag.getAttribute('data-testid'));
    document.querySelectorAll(SELS.DRAG_SEL).forEach((e) => {
      const t = e.getAttribute('data-testid');
      if (t) ids.add(t);
    });
    const pre = drag?.getBoundingClientRect();
    bag._drag = {
      pre: pre ? [pre.x, pre.y, pre.width, pre.height] : undefined,
      targets: [...ids].slice(0, 6),
      startT: performance.now(),
    };
    ids.forEach((id) => {
      if (!bag.drags.some((d) => d.id === id)) bag.drags.push({ id, rects: [] });
    });
  }, true);
  window.__sentinelPerfStart = () => {
    bag.sampling = true;
    bag._last = performance.now();
    if (!bag._raf) bag._raf = requestAnimationFrame(tick);
  };
  window.__sentinelPerfStop = () => {
    bag.sampling = false;
    if (bag._raf) cancelAnimationFrame(bag._raf);
    bag._raf = undefined;
  };
})`;

/** Serialized invocation of {@link INSTALLER_SRC} with the selector map. */
function installerScript(): string {
  return `${INSTALLER_SRC}(${JSON.stringify({ HEADING_SEL, ART_SEL, DRAG_SEL })})`;
}

/**
 * Installs the sampler before any page script runs (idempotent).
 * `addInitScript` fires on FUTURE documents only — when the page is already
 * loaded (mid-run audits) the installer is evaluated directly so the bag and
 * start/stop hooks exist on the live document too.
 */
export async function installTemporalPerfSampler(ctx: HarnessCtx): Promise<void> {
  await ctx.context.addInitScript(installerScript());
  const installed = await ctx.page.evaluate(() => Boolean(window.__sentinelPerf)).catch(() => false);
  if (!installed) await ctx.page.evaluate(installerScript());
}

/** Starts in-page sampling (call just before driving into the state). */
export async function startTemporalSampling(ctx: HarnessCtx): Promise<void> {
  await ctx.page.evaluate(() => (window as any).__sentinelPerfStart?.());
}

/** Stops sampling and drains the collected buffers. */
export async function stopTemporalSampling(ctx: HarnessCtx): Promise<TemporalPerfSamples> {
  return ctx.page.evaluate(() => {
    (window as any).__sentinelPerfStop?.();
    const bag = window.__sentinelPerf;
    if (!bag) return { frames: [], longTasks: [], drags: [] }; // sampler never installed (e.g. fresh doc)
    const out = { frames: bag.frames, longTasks: bag.longTasks, drags: bag.drags };
    bag.frames = [];
    bag.longTasks = [];
    bag.drags = [];
    return out;
  });
}

/**
 * Pure evaluation of collected samples into findings. `stateNode` and
 * `perturbation` are supplied by the runner at evaluation time.
 */
export function evaluateTemporalPerf(
  samples: TemporalPerfSamples,
  cfg: SentinelConfig,
  stateNode: string,
  perturbation: AuditPerturbation,
): OracleFinding[] {
  const findings: OracleFinding[] = [];
  const t = cfg.temporalPerf;

  // Long-task clustering during interactions (T-08, R-265). Signature is
  // quantized to 50ms buckets — raw durations jitter across replays and
  // would defeat exact-signature dedup.
  const flagged = samples.longTasks.filter((lt) => lt.duration > t.longTaskThresholdMs);
  if (flagged.length >= t.minLongTasksFlagged) {
    findings.push({
      oracle_id: 'temporal-perf:longtask',
      signature: `longtask|${Math.round(Math.max(...flagged.map((f) => f.duration)) / 50) * 50}`,
      signature_family: 'longtask',
      title: `${flagged.length} long tasks >${t.longTaskThresholdMs}ms during ${stateNode}`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: {
        longTasks: flagged.slice(0, 10),
        worst: Math.max(...flagged.map((f) => f.duration)),
      },
    });
  }

  // p95 frame time above budget (interaction fluidity)
  const deltas = samples.frames.map((f) => f.deltaMs).filter((d) => d > 0);
  if (deltas.length >= 30) {
    const sorted = [...deltas].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    if (p95 > t.frameP95Ms) {
      findings.push({
        oracle_id: 'temporal-perf:frame-p95',
        signature: `frame-p95|${Math.round(p95)}`,
        signature_family: 'frame-p95',
        title: `p95 frame ${Math.round(p95)}ms exceeds ${t.frameP95Ms}ms budget`,
        severity: 'defect',
        state_node: stateNode,
        perturbation_kind: perturbation,
        evidence: { p95, frames: deltas.length },
      });
    }
  }

  // T-A3 title/art desync: each image remembers the heading first seen with
  // it; a frame whose heading differs from that pairing is a desync frame.
  const imgHeading = new Map<string, string>();
  let desyncRun = 0;
  let maxDesyncRun = 0;
  let runStart: FrameSample | null = null;
  let firstDesync: FrameSample | null = null;
  for (const f of samples.frames) {
    if (f.heading == null || f.activeImg == null) continue;
    const paired = imgHeading.get(f.activeImg);
    if (paired === undefined) {
      imgHeading.set(f.activeImg, f.heading);
      desyncRun = 0;
      runStart = null;
      continue;
    }
    if (paired !== f.heading) {
      desyncRun++;
      if (desyncRun === 1) runStart = f;
      if (desyncRun > maxDesyncRun) {
        maxDesyncRun = desyncRun;
        firstDesync = runStart;
      }
    } else {
      desyncRun = 0;
      runStart = null;
    }
  }
  if (maxDesyncRun >= t.titleArtDesyncFrames && firstDesync) {
    findings.push({
      oracle_id: 'temporal-perf:title-art-desync',
      signature: `desync|${firstDesync.heading}|${firstDesync.activeImg}`,
      signature_family: 'title-art-desync',
      title: `Heading committed ${maxDesyncRun} frames before the artwork switched`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { framesDesynced: maxDesyncRun, heading: firstDesync.heading, staleImg: firstDesync.activeImg },
    });
  }

  // BV-04: animations running while the surface declares itself parked.
  const parkedFrames = samples.frames.filter((f) => f.astroIdle === 'parked' && f.runningAnimations > 0);
  if (parkedFrames.length > 0) {
    findings.push({
      oracle_id: 'temporal-perf:parked-animation',
      signature: `parked-anim|${Math.max(...parkedFrames.map((f) => f.runningAnimations))}`,
      signature_family: 'parked-animation',
      title: `${parkedFrames.length} frames with running animations while parked`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { frames: parkedFrames.length, worstRunning: Math.max(...parkedFrames.map((f) => f.runningAnimations)) },
    });
  }

  // T-A6 / R-257: post-release bounce — a tracked drag element's rect moves
  // back toward its pre-drag position after pointerup within the window.
  for (const drag of samples.drags) {
    if (!drag.preDrag || drag.rects.length < 2) continue;
    const [px, py] = drag.preDrag;
    const first = drag.rects[0];
    const bounces = drag.rects.some(
      (r, i) =>
        i > 0 &&
        Math.abs(r[0] - px) < Math.abs(first[0] - px) - 8 &&
        Math.abs(r[1] - py) < Math.abs(first[1] - py) - 8,
    );
    const durationMs =
      samples.frames.length > 1
        ? Math.min(t.ghostFramePostDragMs, samples.frames.at(-1)!.t - samples.frames[0].t)
        : 0;
    if (bounces && durationMs > 0) {
      findings.push({
        oracle_id: 'temporal-perf:drag-ghost',
        signature: `drag-ghost|${drag.id}`,
        signature_family: 'drag-ghost',
        title: `Post-release snap-back on ${drag.id} within ${t.ghostFramePostDragMs}ms`,
        severity: 'defect',
        state_node: stateNode,
        perturbation_kind: perturbation,
        target: `[data-testid="${drag.id}"]`,
        evidence: { trackedRects: drag.rects.length, preDrag: drag.preDrag },
      });
    }
  }

  return findings;
}
