/**
 * gamePerfProbe — `window.__gamePerf` (PLAN-031 T-B1/T-B3).
 *
 * Named frame-time segments measured on the real rAF loop: each gesture gets
 * frames/p50/p95/worst/longFrames, so "is it smooth" is a number, not an
 * opinion. `runSuite()` replays the standard /game gestures — map pan, zoom,
 * menu open/close, medal-drag mount — with the same pacing every run, from
 * inside the page so it works identically headed, headless and under
 * Playwright (`page.evaluate(() => __gamePerf.runSuite())`).
 *
 * Installed by `game-frame-pixi` in dev and playwright-preview builds only.
 * Budgets live in `config/gamePerfBudgets.ts`.
 */

import { GAME_PERF_BUDGETS } from '@/ui/idleVillage/config/gamePerfBudgets';

/** Frame statistics for one named segment, all in milliseconds. */
export interface GamePerfSegmentStats {
  name: string;
  frames: number;
  durationMs: number;
  p50: number;
  p95: number;
  worst: number;
  /** Frames above `budgets.longFrameMs`. */
  longFrames: number;
}

/** Everything the probe collected since the last `reset()`. */
export interface GamePerfReport {
  segments: GamePerfSegmentStats[];
  marks: Record<string, number>;
  /** `{ interactiveMs }` as recorded by the page when the boot veil lifted. */
  boot?: { interactiveMs: number };
}

/** The probe object published on `window.__gamePerf`. */
export interface GamePerfProbe {
  /** Opens a segment; frames are collected until `end()`. Re-entering the same name resets it. */
  begin(name: string): void;
  /** Closes the segment (default: the most recent one) and returns its stats. */
  end(name?: string): GamePerfSegmentStats | null;
  /** Timestamps an instant, readable by `measure` and `report().marks`. */
  mark(name: string): void;
  /** Milliseconds between two marks (`toMark` defaults to now). Null if a mark is missing. */
  measure(name: string, fromMark: string, toMark?: string): number | null;
  /** Runs a gesture inside a segment and returns its stats. */
  run(name: string, gesture: () => void | Promise<void>): Promise<GamePerfSegmentStats>;
  /** The canonical /game gesture suite: boot + pan + zoom + menu + medal drag mount. */
  runSuite(): Promise<GamePerfReport>;
  /** All completed segments and marks. */
  report(): GamePerfReport;
  /** Clears segments and marks (not the boot record). */
  reset(): void;
}

interface OpenSegment {
  deltas: number[];
  startedAt: number;
}

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
};

const summarize = (name: string, { deltas, startedAt }: OpenSegment, longFrameMs: number): GamePerfSegmentStats => {
  const sorted = [...deltas].sort((a, b) => a - b);
  return {
    name,
    frames: deltas.length,
    durationMs: Math.round(performance.now() - startedAt),
    p50: Math.round(percentile(sorted, 50) * 10) / 10,
    p95: Math.round(percentile(sorted, 95) * 10) / 10,
    worst: Math.round((sorted[sorted.length - 1] ?? 0) * 10) / 10,
    longFrames: deltas.filter((d) => d > longFrameMs).length,
  };
};

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const pointer = (el: Element, type: string, x: number, y: number, buttons = 0) =>
  el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, button: 0, buttons }));
const wheel = (el: Element, x: number, y: number, deltaY: number) =>
  el.dispatchEvent(new WheelEvent('wheel', { clientX: x, clientY: y, deltaY, bubbles: true, cancelable: true }));

/**
 * Creates and returns the probe. The caller owns publishing it on `window`
 * (`__gamePerf`) so the same engine can be unit-tested without a DOM global.
 */
export function createGamePerfProbe(): GamePerfProbe {
  const { longFrameMs } = GAME_PERF_BUDGETS.budgets;
  const suite = GAME_PERF_BUDGETS.suite;
  const open = new Map<string, OpenSegment>();
  const openOrder: string[] = [];
  const segments: GamePerfSegmentStats[] = [];
  const marks = new Map<string, number>();
  let rafId = 0;
  let last = 0;

  const loop = (t: number) => {
    const delta = t - last;
    last = t;
    for (const seg of open.values()) seg.deltas.push(delta);
    rafId = requestAnimationFrame(loop);
  };
  const ensureLoop = () => {
    if (!rafId && open.size > 0) {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  };
  const maybeStop = () => {
    if (open.size === 0 && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const probe: GamePerfProbe = {
    begin(name) {
      open.set(name, { deltas: [], startedAt: performance.now() });
      if (!openOrder.includes(name)) openOrder.push(name);
      ensureLoop();
    },
    end(name) {
      const key = name ?? openOrder[openOrder.length - 1];
      const seg = key ? open.get(key) : undefined;
      if (!key || !seg) return null;
      open.delete(key);
      openOrder.splice(openOrder.indexOf(key), 1);
      maybeStop();
      const stats = summarize(key, seg, longFrameMs);
      segments.push(stats);
      return stats;
    },
    mark(name) {
      marks.set(name, performance.now());
      try {
        performance.mark(`game-perf:${name}`);
      } catch {
        /* marks are best-effort */
      }
    },
    measure(_name, fromMark, toMark) {
      const from = marks.get(fromMark);
      if (from === undefined) return null;
      const to = toMark ? marks.get(toMark) : performance.now();
      if (to === undefined) return null;
      return Math.round((to - from) * 10) / 10;
    },
    async run(name, gesture) {
      probe.begin(name);
      try {
        await gesture();
      } finally {
        probe.end(name);
      }
      return segments[segments.length - 1];
    },
    async runSuite() {
      probe.reset();
      const boot = (window as unknown as { __gameBoot?: { interactiveMs: number } }).__gameBoot;

      // ── map-pan: hold and drag left, one move per frame ──
      await probe.run('map-pan', async () => {
        const canvas = document.querySelector('[data-testid="pixi-world-canvas"]');
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        const x0 = r.left + r.width * 0.6;
        const y0 = r.top + r.height * 0.5;
        pointer(canvas, 'mousedown', x0, y0, 1);
        for (let i = 0; i < suite.panSteps; i += 1) {
          pointer(canvas, 'mousemove', x0 + suite.panStepPx * (i + 1), y0, 1);
          await nextFrame();
        }
        pointer(canvas, 'mouseup', x0 + suite.panStepPx * suite.panSteps, y0, 0);
        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        await sleep(suite.settleMs);
      });

      // ── map-zoom: wheel pulses on the canvas ──
      await probe.run('map-zoom', async () => {
        const canvas = document.querySelector('[data-testid="pixi-world-canvas"]');
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        const x = r.left + r.width * 0.5;
        const y = r.top + r.height * 0.5;
        for (let i = 0; i < suite.zoomSteps; i += 1) {
          wheel(canvas, x, y, suite.zoomDeltaY);
          await sleep(suite.zoomDelayMs);
        }
        await sleep(suite.settleMs);
      });

      // ── menu-open: game menu opens, then Escape closes it ──
      await probe.run('menu-open', async () => {
        const trigger = document.querySelector<HTMLElement>('button[aria-haspopup="menu"]');
        if (!trigger) return;
        trigger.click();
        await sleep(suite.menuDelayMs);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await sleep(suite.settleMs);
      });

      // ── medal-drag-mount: the cold path of a PG card drag, via the session
      //    hook — overlay mount + first frames, then release. Real-pointer drag
      //    is covered by the Playwright spec (dnd-kit ignores synthetic events). ──
      await probe.run('medal-drag-mount', async () => {
        const hooks = (window as unknown as { __idleVillageTestHooks?: { setDraggingResidentId?: (id: string | null) => void } })
          .__idleVillageTestHooks;
        const medal = document.querySelector('[data-resident-id]');
        const residentId = medal?.getAttribute('data-resident-id');
        if (!hooks?.setDraggingResidentId || !residentId) return;
        hooks.setDraggingResidentId(residentId);
        await sleep(suite.medalHoldMs);
        hooks.setDraggingResidentId(null);
        await sleep(suite.settleMs);
      });

      return { ...probe.report(), ...(boot ? { boot } : {}) };
    },
    report() {
      const boot = (window as unknown as { __gameBoot?: { interactiveMs: number } }).__gameBoot;
      return { segments: [...segments], marks: Object.fromEntries(marks), ...(boot ? { boot } : {}) };
    },
    reset() {
      segments.length = 0;
      marks.clear();
    },
  };
  return probe;
}

/** Installs `window.__gamePerf` and returns the probe (idempotent: a second call returns the existing one). */
export function installGamePerfProbe(win: Window = window): GamePerfProbe {
  const w = win as unknown as { __gamePerf?: GamePerfProbe };
  if (!w.__gamePerf) w.__gamePerf = createGamePerfProbe();
  return w.__gamePerf;
}
