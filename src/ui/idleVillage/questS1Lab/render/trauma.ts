/**
 * trauma — the quest theater's trauma-shake channel (PLAN-050 §4).
 *
 * Pure function of the shared camera clock: `cameraAt()` stays untouched —
 * trauma is evaluated separately and COMPOSED after it, so authored shot
 * endpoints can never be corrupted:
 *
 *   authored = cameraAt(shot, t)
 *   trauma   = traumaAt(t − traumaEpoch, strength, cfg.trauma)
 *   state.pan += trauma.xy · bgWeight        (uniform wobble — ambient
 *                                             emitters and the DOM img
 *                                             follow the SAME window)
 *   shader  += trauma.xy · (weight(depth) − bgWeight)   (FG extra)
 *   shader/DOM rotate by trauma.roll (depth-weighted on GPU, domScale on DOM)
 *
 * Envelope: amp = (strength · e^(−t/decay))² — the trauma² model: a punchy
 * onset that bleeds off fast (impact reads, then the frame re-locks).
 * Noise: two incommensurate sine pairs per axis + one for roll — cheap,
 * deterministic, band-limited (no Perlin table needed).
 *
 * Never injected during reading/choice beats (the resolver/beat wiring
 * decides when to call it); reduced-motion zeroes it upstream.
 */

import type { QuestDepthFx } from '@/balancing/config/idleVillage/quests/questTheatreFx';

type TraumaCfg = QuestDepthFx['trauma'];

export interface TraumaState {
  /** Source-UV offset at this instant (already strength·decay scaled). */
  readonly x: number;
  readonly y: number;
  /** Rotation in radians at this instant. */
  readonly roll: number;
  /** Envelope 0..1 — strength·decay before the square. */
  readonly envelope: number;
}

const TAU = Math.PI * 2;
/* Incommensurate angular frequencies (rad/ms): 0.09–0.31 kHz band, no
 * common period inside any realistic shake duration. */
const FX1 = TAU * 0.0131;
const FX2 = TAU * 0.0317;
const FY1 = TAU * 0.0113;
const FY2 = TAU * 0.0289;
const FR1 = TAU * 0.0097;
const FR2 = TAU * 0.0233;

/**
 * Evaluate the trauma channel `tMs` after injection.
 * `strength` ∈ [0,1] — callers map harm severity onto it.
 * tMs ≤ 0 → rest state (pre-injection is perfectly still).
 */
export function traumaAt(tMs: number, strength: number, cfg: TraumaCfg): TraumaState {
  if (tMs <= 0 || strength <= 0) return { x: 0, y: 0, roll: 0, envelope: 0 };
  const s = Math.min(1, strength);
  const e = s * Math.exp(-tMs / cfg.decayMs);
  const amp = e * e;
  const t = tMs / 1000;
  const nx = (Math.sin(FX1 * t * 1000) + 0.6 * Math.sin(FX2 * t * 1000 + 1.3)) / 1.6;
  const ny = (Math.sin(FY1 * t * 1000 + 0.7) + 0.6 * Math.sin(FY2 * t * 1000 + 2.1)) / 1.6;
  const nr = (Math.sin(FR1 * t * 1000 + 0.4) + 0.5 * Math.sin(FR2 * t * 1000 + 1.9)) / 1.5;
  return {
    x: nx * amp * cfg.maxPan,
    y: ny * amp * cfg.maxPan,
    roll: nr * amp * ((cfg.maxRollDeg * Math.PI) / 180),
    envelope: e,
  };
}

/** Worst-case per-axis sampled offset the proof must reserve — FG weight. */
export function traumaMaxOffset(cfg: TraumaCfg): number {
  return cfg.maxPan * cfg.fgWeight;
}

/**
 * Compose trauma onto an authored camera state — pan gets the UNIFORM
 * (bgWeight) share so ambient emitters, the DOM img and the shader's base
 * window all move together; the shader adds only the FG residual
 * `trauma.xy·(weight − bgWeight)` on top. Zoom gets the impact punch
 * (`1 + envelope·zoomBump`) — it reads as the impact AND buys the edge
 * margin the wobble spends (the edge proof certifies the bumped case).
 */
export function composeTrauma<T extends { pan: readonly [number, number]; zoom: number }>(
  state: T,
  tr: TraumaState,
  cfg: TraumaCfg,
): T {
  if (tr.envelope <= 0) return state;
  return {
    ...state,
    zoom: state.zoom * (1 + tr.envelope * cfg.zoomBump),
    pan: [state.pan[0] + tr.x * cfg.bgWeight, state.pan[1] + tr.y * cfg.bgWeight],
  };
}

/**
 * Worst-case corner displacement of the roll term, in source-UV, for a
 * sampled half-extent (hx, hy): a corner at (hx,hy) rotated by rollMax
 * moves ≤ rollMax·(hx+hy) (conservative linear bound on √).
 */
export function traumaMaxRollShift(cfg: TraumaCfg, half: readonly [number, number]): number {
  const rollMax = (cfg.maxRollDeg * Math.PI) / 180;
  return rollMax * (half[0] + half[1]);
}
