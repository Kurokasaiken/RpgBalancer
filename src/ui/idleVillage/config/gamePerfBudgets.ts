/**
 * gamePerfBudgets — the /game performance contract (PLAN-031 T-B4).
 *
 * Ratified by the Director (2026-10-12): p95 ≤ 33 ms per gesture, zero long
 * frames (> 50 ms), first interactive ≤ 4 s on the dev machine, drag
 * pointerdown → overlay ≤ 100 ms. Headless CI runs get documented slack —
 * headless rAF is vsync-emulated and noisier — but the authoritative verdict
 * stays the headed run (T-04).
 *
 * Read by `gamePerfProbe` (in-page harness) and `tests/e2e/idleVillage/gamePerf.spec.ts`.
 */

import { z } from 'zod';

const gamePerfBudgetsSchema = z.object({
  budgets: z.object({
    /** A single frame above this is a long frame — jank the player feels. */
    longFrameMs: z.number().positive(),
    /** Worst allowed p95 frame time within any measured gesture segment. */
    gestureP95MaxMs: z.number().positive(),
    /** Long frames allowed inside one gesture segment. */
    gestureMaxLongFrames: z.number().int().nonnegative(),
    /** Page open → veil fully lifted (dev machine, warm cache). */
    firstInteractiveMaxMs: z.number().positive(),
    /** pointerdown on a medal → the drag overlay is mounted. */
    dragOverlayMountMaxMs: z.number().positive(),
    /**
     * R-238 / INV:custom-drag-overlay.INV-1 — the FIRST hold on a roster card may
     * cost at most this much more than an already-warm hold (cold-mount penalty).
     */
    dragOverlayColdDeltaMaxMs: z.number().positive(),
    /**
     * R-238 — pointerdown → drag preview in the DOM on a warm hold (includes the
     * holdToDragMs activation delay). Headless slack applies via headless.p95Multiplier.
     */
    dragOverlayWarmShowMaxMs: z.number().positive(),
    /** Headless slack: vsync-emulated rAF is noisier; verdict still comes from the headed run. */
    headless: z.object({
      p95Multiplier: z.number().positive(),
      maxLongFrames: z.number().int().nonnegative(),
    }),
  }),
  /** The scripted gestures run by `__gamePerf.runSuite()` — kept here so tune-ups land in config, not code. */
  suite: z.object({
    /** Pan: one move per frame for this many frames, then release. */
    panSteps: z.number().int().positive(),
    /** Horizontal delta per pan step (px). */
    panStepPx: z.number(),
    /** Wheel pulses for the zoom gesture. */
    zoomSteps: z.number().int().positive(),
    /** deltaY per wheel pulse (negative = zoom in). */
    zoomDeltaY: z.number(),
    /** Pause between wheel pulses. */
    zoomDelayMs: z.number().positive(),
    /** How long the forced medal drag stays mounted. */
    medalHoldMs: z.number().int().positive(),
    /** Idle tail after each gesture so late frames are counted too. */
    settleMs: z.number().int().positive(),
    /** Wait for a menu to appear/disappear inside its own gesture. */
    menuDelayMs: z.number().int().positive(),
  }),
});

export type GamePerfBudgets = z.infer<typeof gamePerfBudgetsSchema>;

const RAW_GAME_PERF_BUDGETS: GamePerfBudgets = {
  budgets: {
    longFrameMs: 50,
    gestureP95MaxMs: 33,
    gestureMaxLongFrames: 0,
    firstInteractiveMaxMs: 4000,
    dragOverlayMountMaxMs: 100,
    /* R-238 measured values (automation): pre-fix delta ≈ 400-490 ms, post
     * pre-warm residual ≈ 0-200 ms (first-execution noise of the dnd-kit
     * activation path). 250 catches the regression signature with CI slack. */
    dragOverlayColdDeltaMaxMs: 250,
    dragOverlayWarmShowMaxMs: 500,
    headless: { p95Multiplier: 1.5, maxLongFrames: 4 },
  },
  suite: {
    panSteps: 45,
    panStepPx: -14,
    zoomSteps: 6,
    zoomDeltaY: -120,
    zoomDelayMs: 150,
    medalHoldMs: 700,
    settleMs: 300,
    menuDelayMs: 350,
  },
};

/** Validated performance contract — import this, never the raw literal. */
export const GAME_PERF_BUDGETS = gamePerfBudgetsSchema.parse(RAW_GAME_PERF_BUDGETS);
