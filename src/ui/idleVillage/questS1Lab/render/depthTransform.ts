/**
 * depthTransform — single source of truth for the quest cinema camera's
 * composed transform and its edge-safety proof (PLAN-046, artifact-r011 §5).
 *
 * One math model feeds three consumers:
 *   1. the GLSL depth-parallax shader (`depthShader.ts`) — same uniforms,
 *      same formula;
 *   2. the DOM `<img>` fallback — same camera state, CSS-space mapping;
 *   3. the build-time invariant — `certifyShot`/`certifyDom` prove no edge
 *      is ever exposed, analytically, over the whole trajectory.
 *
 * Geometry model (source image UV ∈ [0,1]², y down):
 *   - cover-fit + object-position anchor crops c_a total on the cropped
 *     axis, split by the anchor;
 *   - the sampled window = center + pan ± halfExtent, where the center
 *     keeps source(anchor) at view(anchor) — the DOM `transform-origin`
 *     semantic: center_a = anchor_a + (0.5 − anchor_a)·2·half_a;
 *   - halfExtent_a = (0.5 − c_a) · (1 − overscan) / zoom;
 *   - depth displacement adds ±disp_a on top of pan, worst-case per axis.
 *
 * Because z(e) is affine in easing progress e and pan(e) is linear,
 * half(e) ± off(e) is convex in e → its max over the reachable e range is
 * at a range endpoint. The proof therefore evaluates the e-endpoints only
 * — a closed-form result, not a numeric sweep.
 */

import { EASINGS, type EasingId } from '@/balancing/config/idleVillage/quests/questCameraEasings';
import type { CameraShot, QuestDepthFx } from '@/balancing/config/idleVillage/quests/questTheatreFx';

/**
 * The Theater's crop anchor — `object-position: 50% 40%` in the DOM and
 * `transform-origin` for the CSS transform. One constant feeds the shader
 * mirror, the DOM transform and the edge proof (anchor-aware slacks).
 */
export const THEATER_ANCHOR = [0.5, 0.4] as const;

/** Resolved camera state at a point in the shot. */
export interface CameraState {
  /** Easing progress (may exceed 1 on overshoot easings). */
  readonly e: number;
  readonly zoom: number;
  /** Sampled-window offset, source-UV units. */
  readonly pan: readonly [number, number];
  /** Depth parallax direction, |v| ≤ 1 per axis. */
  readonly camVec: readonly [number, number];
  readonly ampMul: number;
}

/** Cover-fit geometry for (image aspect, view aspect). */
export interface CoverFit {
  /** Rendered extent per axis in view fractions (one axis is exactly 1). */
  readonly extent: readonly [number, number];
  /** Total crop fraction per axis (0 on the tight axis). */
  readonly crop: readonly [number, number];
}

/** Pure camera evaluation — the injectable-clock contract (artifact-r011). */
export function cameraAt(shot: CameraShot, tMs: number): CameraState {
  const ease = EASINGS[shot.ease as EasingId];
  const t = shot.durMs <= 0 ? 1 : Math.min(1, Math.max(0, tMs / shot.durMs));
  const e = ease.fn(t);
  return {
    e,
    zoom: shot.zoomFrom + (shot.zoomTo - shot.zoomFrom) * e,
    pan: [shot.panTo[0] * e, shot.panTo[1] * e],
    camVec: shot.camVec,
    ampMul: shot.ampMul,
  };
}

/** Reachable progress range for the shot's easing — overshoot included. */
export function progressRange(shot: CameraShot): readonly [number, number] {
  return EASINGS[shot.ease as EasingId].valueRange;
}

/** Cover-fit crop for a image of aspect `imgAspect` in a view of `viewAspect`. */
export function coverFit(imgAspect: number, viewAspect: number): CoverFit {
  if (imgAspect > viewAspect) {
    // image wider → height fills, x overflows
    const ex = imgAspect / viewAspect;
    return { extent: [ex, 1], crop: [(1 - 1 / ex) / 2, 0] };
  }
  const ey = viewAspect / imgAspect;
  return { extent: [1, ey], crop: [0, (1 - 1 / ey) / 2] };
}

/**
 * Center of the cover-fit visible window, honoring the object-position
 * anchor: windowStart_a = anchor_a · 2·c_a → center = anchor·2c + (0.5−c).
 * For anchor 0.5 this is exactly 0.5.
 */
export function windowCenter(crop: readonly [number, number], anchor: readonly [number, number]): readonly [number, number] {
  return [anchor[0] * 2 * crop[0] + (0.5 - crop[0]), anchor[1] * 2 * crop[1] + (0.5 - crop[1])];
}

/** Worst-case |d − focal| over d ∈ [0,1]. */
export function maxDepthDeviation(focal: number): number {
  return Math.max(focal, 1 - focal);
}

/** Worst-case depth displacement magnitude per axis (source-UV units). */
export function maxDisp(state: Pick<CameraState, 'camVec' | 'ampMul'>, cfg: QuestDepthFx): readonly [number, number] {
  const dev = maxDepthDeviation(cfg.focal);
  const a = cfg.amp * state.ampMul * dev;
  return [a * Math.abs(state.camVec[0]), a * Math.abs(state.camVec[1])];
}

/** Sampled-window half extent per axis at zoom z. */
export function halfExtent(crop: readonly [number, number], zoom: number, overscan: number): readonly [number, number] {
  return [((0.5 - crop[0]) * (1 - overscan)) / zoom, ((0.5 - crop[1]) * (1 - overscan)) / zoom];
}

/**
 * Uniforms for the GLSL mirror — the shader evaluates
 *   base = uWinCenter + (vUV − 0.5)·2·uWinHalf
 *   uv   = base + (d − uFocal)·uAmpEff·uCamVec
 * which is exactly this transform.
 */
export function shaderUniforms(
  state: CameraState,
  cfg: QuestDepthFx,
  imgAspect: number,
  viewAspect: number,
  anchor: readonly [number, number],
): { center: [number, number]; half: [number, number]; ampEff: number; camVec: [number, number] } {
  const fit = coverFit(imgAspect, viewAspect);
  const half = halfExtent(fit.crop, state.zoom, cfg.overscan);
  // Anchor-pivot center: source(anchor_a) stays at view(anchor_a) for any
  // zoom — exactly what the DOM path's transform-origin does.
  const cx = anchor[0] + (0.5 - anchor[0]) * 2 * half[0];
  const cy = anchor[1] + (0.5 - anchor[1]) * 2 * half[1];
  return {
    center: [cx + state.pan[0], cy + state.pan[1]],
    half: [half[0], half[1]],
    ampEff: cfg.amp * state.ampMul,
    camVec: [state.camVec[0], state.camVec[1]],
  };
}

/**
 * CSS-space transform for the DOM fallback, honoring the same anchor via
 * `transform-origin`. `translate(tx%, ty%) scale(k)` composes as
 * p → k·(p + t): a source-UV pan p shifts content by −p·E_a of the
 * element (view) width before the zoom — the same sampled window.
 */
export function domTransform(
  state: CameraState,
  cfg: QuestDepthFx,
  imgAspect: number,
  viewAspect: number,
): { scale: number; txPct: number; tyPct: number } {
  const fit = coverFit(imgAspect, viewAspect);
  const k = state.zoom / (1 - cfg.overscan); // s_base·z — s_base derived 1/(1−o), not configured
  return {
    scale: k,
    txPct: -state.pan[0] * fit.extent[0] * 100,
    tyPct: -state.pan[1] * fit.extent[1] * 100,
  };
}

/** Per-side slack result for a certified shot on one axis. */
export interface AxisMargin {
  /** Worst slack between the sampled window and each image edge. */
  readonly low: number;
  readonly high: number;
}

export interface CertifyResult {
  readonly ok: boolean;
  /** Worst margin across axes/sides/viewAspect endpoints (negative = fail). */
  readonly minMargin: number;
  /** Human-readable failures with derived values for the error message. */
  readonly failures: string[];
}

const AXES = [0, 1] as const;

/**
 * Certified shader-path edge proof for one shot at one (img,view) pair.
 *
 * For axis a and easing-progress range [e0, e1]:
 *   off(e)  = pan_a(e)          (affine in e — interval = endpoints)
 *   half(e) = (0.5−c_a)(1−o)/z(e) (convex in e — max at an endpoint)
 *   sampled window ⊆ [ε, 1−ε] iff, for both e-endpoints and both signs:
 *     windowCenter_a + σ·(off_a + disp_a) + half_a ≤ upperSlack
 *     windowCenter_a + σ·(off_a − disp_a) − half_a ≥ lowerSlack
 * evaluated exactly — convexity certifies no interior point is worse.
 */
export function certifyShaderEdge(
  shot: CameraShot,
  cfg: QuestDepthFx,
  imgAspect: number,
  viewAspect: number,
  anchor: readonly [number, number],
): CertifyResult {
  const fit = coverFit(imgAspect, viewAspect);
  const [e0, e1] = progressRange(shot);
  const disp = maxDisp({ camVec: shot.camVec, ampMul: shot.ampMul }, cfg);
  const failures: string[] = [];
  let minMargin = Infinity;

  for (const a of AXES) {
    for (const e of [e0, e1]) {
      const z = shot.zoomFrom + (shot.zoomTo - shot.zoomFrom) * e;
      const p = shot.panTo[a] * e;
      const half = ((0.5 - fit.crop[a]) * (1 - cfg.overscan)) / z;
      // Center moves with zoom — the anchor is the pivot (DOM parity).
      const wcA = anchor[a] + (0.5 - anchor[a]) * 2 * half;
      // σ = +1 → high edge: center + off + half ≤ 1 − ε
      // σ = −1 → low edge:  center + off − half ≥ ε
      for (const sigma of [1, -1] as const) {
        const off = p + sigma * disp[a];
        const edge = sigma > 0 ? 1 - cfg.epsilon : cfg.epsilon;
        const sampledEdge = wcA + off + sigma * half;
        const margin = sigma > 0 ? edge - sampledEdge : sampledEdge - edge;
        if (margin < minMargin) minMargin = margin;
        if (margin < 0) {
          failures.push(
            `axis ${a === 0 ? 'x' : 'y'} ${sigma > 0 ? 'high' : 'low'} edge: ` +
              `sampled ${sampledEdge.toFixed(4)} vs ${edge.toFixed(4)} ` +
              `(e=${e.toFixed(3)}, z=${z.toFixed(3)}, pan=${p.toFixed(4)}, disp=${disp[a].toFixed(4)}, ` +
              `half=${half.toFixed(4)} — needs zoom ≥ ${requiredZoom(z, wcA, off, fit.crop[a], cfg, sigma).toFixed(3)})`,
          );
        }
      }
    }
  }
  return { ok: failures.length === 0, minMargin, failures };
}

/** Derived required zoom so the failing side just clears — error helper. */
function requiredZoom(
  z: number,
  center: number,
  off: number,
  c: number,
  cfg: QuestDepthFx,
  sigma: 1 | -1,
): number {
  const edge = sigma > 0 ? 1 - cfg.epsilon : cfg.epsilon;
  // |center + off − edge| is the room the half extent must fit in.
  const room = Math.abs(edge - center - off);
  if (room <= 0) return Infinity;
  return ((0.5 - c) * (1 - cfg.overscan)) / room;
}

/**
 * Certified DOM-path edge proof (CSS space — NOT the shader bound).
 *
 * The img renders at scale k = s_base·z (s_base = 1/(1−o), derived) with
 * extent E_a view-fractions; the anchor pins the anchor point of the image
 * at the anchor point of the view. Content shift s_a = pan_a·k·E_a
 * view-fractions. Cover requires, per side:
 *   s_a ≤ anchorSlack:   (1−anchor_a)(k·E_a − 1)   [shift toward left/top]
 *   s_a ≥ −anchorSlack:  anchor_a·(k·E_a − 1)      [shift toward right/bottom]
 * with the strict margin folded into ε: k·E_a − 1 ≥ 2ε_dom. Convexity of
 * z(e)·pan(e) is not needed — s(e) = p_a·e·s_base·z(e) is a cubic-free
 * product bounded by evaluating both e-endpoints (max |p·z| on [e0,e1] is
 * at an endpoint since p·z is a quadratic with positive e² coefficient).
 */
export function certifyDomEdge(
  shot: CameraShot,
  cfg: QuestDepthFx,
  imgAspect: number,
  viewAspect: number,
  anchor: readonly [number, number],
): CertifyResult {
  const fit = coverFit(imgAspect, viewAspect);
  const [e0, e1] = progressRange(shot);
  const sBase = 1 / (1 - cfg.overscan);
  const failures: string[] = [];
  let minMargin = Infinity;

  for (const a of AXES) {
    const E = fit.extent[a];
    // p·z quadratic: endpoints + interior vertex if p·z' has a root in range.
    const candidates = new Set<number>([e0, e1]);
    const pz = shot.panTo[a];
    if (pz !== 0 && shot.zoomTo !== shot.zoomFrom) {
      // s(e) = s_base·E·panTo·e·(zoomFrom + Δz·e) → vertex at e* = −zoomFrom/(2Δz)
      const dz = shot.zoomTo - shot.zoomFrom;
      const vertex = -shot.zoomFrom / (2 * dz);
      if (vertex > e0 && vertex < e1) candidates.add(vertex);
    }
    for (const e of candidates) {
      const z = shot.zoomFrom + (shot.zoomTo - shot.zoomFrom) * e;
      const k = sBase * z;
      const s = shot.panTo[a] * e * k * E; // signed shift, view fractions
      const cover = k * E - 1;
      for (const side of [1, -1] as const) {
        // side +1: shift toward low edge (s>0 uses (1−anchor) slack on high side)
        const slack = (side > 0 ? 1 - anchor[a] : anchor[a]) * Math.max(0, cover) - cfg.epsilon;
        const demand = s * side;
        const margin = slack - demand;
        if (margin < minMargin) minMargin = margin;
        if (margin < 0) {
          failures.push(
            `DOM axis ${a === 0 ? 'x' : 'y'} side ${side > 0 ? 'low' : 'high'}: ` +
              `shift ${demand.toFixed(4)} > slack ${slack.toFixed(4)} ` +
              `(e=${e.toFixed(3)}, k=${k.toFixed(3)}, E=${E.toFixed(3)})`,
          );
        }
      }
    }
  }
  return { ok: failures.length === 0, minMargin, failures };
}

/**
 * Full certification of a resolved shot: shader + DOM bounds at BOTH
 * viewAspect-range endpoints — the whole inequality's worst case is chosen
 * on the complete expression per endpoint (artifact-r011, claude r010).
 */
export function certifyShot(
  shot: CameraShot,
  cfg: QuestDepthFx,
  imgAspect: number,
  anchor: readonly [number, number],
): { shader: CertifyResult; dom: CertifyResult } {
  const shaderFails: string[] = [];
  const domFails: string[] = [];
  let sMin = Infinity;
  let dMin = Infinity;
  for (const va of [cfg.viewAspectRange[0], cfg.viewAspectRange[1]]) {
    const s = certifyShaderEdge(shot, cfg, imgAspect, va, anchor);
    const d = certifyDomEdge(shot, cfg, imgAspect, va, anchor);
    shaderFails.push(...s.failures.map((f) => `viewAspect ${va}: ${f}`));
    domFails.push(...d.failures.map((f) => `viewAspect ${va}: ${f}`));
    sMin = Math.min(sMin, s.minMargin);
    dMin = Math.min(dMin, d.minMargin);
  }
  return {
    shader: { ok: shaderFails.length === 0, minMargin: sMin, failures: shaderFails },
    dom: { ok: domFails.length === 0, minMargin: dMin, failures: domFails },
  };
}
