/**
 * atmosphereOverlay — pure per-frame placement for the atmosphere kit
 * (PLAN-050 T-013). Kept out of the component file so react-refresh keeps
 * `AtmosphereLayer` a components-only module and the transforms stay
 * unit-testable without DOM.
 *
 * Two geometries share one camera mapping: the element's img-fraction
 * anchor is mapped through the same `shaderUniforms` window as the
 * artwork, blended toward view-space by `parallax` (0 = screen-fixed,
 * 1 = glued to the painted ground). All motion is a pure function of
 * `tSec` — frozen `t=` captures are deterministic, nothing accumulates.
 */

import type { AtmosphereFogKit, AtmosphereSpriteKit } from '@/balancing/config/idleVillage/quests/questAtmosphereFx';
import { shaderUniforms, THEATER_ANCHOR, type CameraState } from './depthTransform';
import type { QuestDepthFx } from '@/balancing/config/idleVillage/quests/questTheatreFx';

/** Sprite placement for one frame, in view fractions of the layer box. */
export interface OverlayFrame {
  readonly left: number;
  readonly top: number;
  readonly width: number;
}

/** Wrap `v` into `[0, period)`. */
const wrap = (v: number, period: number) => (((v % period) + period) % period);

/** img-fraction → view-fraction through the camera window. */
function imgToView(
  xImg: number,
  yImg: number,
  wImg: number,
  hImg: number,
  state: Pick<CameraState, 'zoom' | 'pan'>,
  cfg: QuestDepthFx,
  imgAspect: number,
  viewAspect: number,
) {
  const win = shaderUniforms(
    { e: 1, zoom: state.zoom, pan: state.pan, blur: 0, camVec: [0, 0], ampMul: 1 },
    cfg,
    imgAspect,
    viewAspect,
    THEATER_ANCHOR,
  );
  return {
    vx: 0.5 + (xImg - win.center[0]) / (2 * win.half[0]),
    vy: 0.5 + (yImg - win.center[1]) / (2 * win.half[1]),
    vw: wImg / (2 * win.half[0]),
    vh: hImg / (2 * win.half[1]),
  };
}

/**
 * Resolve one SPRITE kit's rect for a camera state at time `tSec`.
 *
 * Drift: the sprite's left edge sits at `anchorLeft` and slides by
 * `speed*tSec`, wrapping over `travel`. For veils (width ≥ 1) the anchor
 * keeps the sprite covering the frame; for crossing sprites it starts
 * off-screen and traverses. Vertical: centered on the band midpoint.
 */
export function overlayFrame(
  kit: AtmosphereSpriteKit,
  state: Pick<CameraState, 'zoom' | 'pan'>,
  cfg: QuestDepthFx,
  imgAspect: number,
  viewAspect: number,
  tSec: number,
  phase = 0,
): OverlayFrame {
  const hImg = kit.width / (kit.widthPx / kit.heightPx);
  const xImg = kit.anchorLeft + wrap(kit.speed * tSec + phase, kit.travel);
  const yImg = (kit.band[0] + kit.band[1]) / 2 - hImg / 2;
  const { vx, vy, vw } = imgToView(xImg, yImg, kit.width, hImg, state, cfg, imgAspect, viewAspect);
  const p = kit.parallax;
  return {
    left: xImg * (1 - p) + vx * p,
    top: yImg * (1 - p) + vy * p,
    width: kit.width * (1 - p) + vw * p,
  };
}

/**
 * Derive the baked fog-pool mask for a scene's depth asset
 * (`/assets/depth/<scene>.webp` → `/assets/atmosphere/fog/mask-<scene>.png`,
 * produced by `scripts/bake-fog-mask.py`). Undefined for anything that is
 * not a depth-map src — callers then mount fog unpooled.
 */
export function fogMaskForDepth(depthSrc: string | undefined): string | undefined {
  const m = depthSrc?.match(/^\/assets\/depth\/(.+)\.webp$/);
  return m ? `/assets/atmosphere/fog/mask-${m[1]}.png` : undefined;
}

/** The fog pool's frame: the rect (view fractions) the depth mask is
 *  stretched over for this camera state. */
export interface FogPoolFrame {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The fog POOL — where fog is allowed to exist — is the whole image
 * mapped through the camera window, blended by the kit's parallax exactly
 * like the veils. The baked depth mask stretched over this rect places
 * fog by scene topology (deep path = dense pool, near trunks = clear),
 * so matter moves inside terrain instead of floating in a band.
 */
export function fogPoolFrame(
  kit: AtmosphereFogKit,
  state: Pick<CameraState, 'zoom' | 'pan'>,
  cfg: QuestDepthFx,
  imgAspect: number,
  viewAspect: number,
): FogPoolFrame {
  const { vx, vy, vw, vh } = imgToView(0, 0, 1, 1, state, cfg, imgAspect, viewAspect);
  const p = kit.parallax;
  return {
    left: vx * p,
    top: vy * p,
    width: (1 - p) + vw * p,
    height: (1 - p) + vh * p,
  };
}

/** One fog veil's frame: rect in view fractions + breathing alpha + the
 *  noise-mask scroll position in tile units (fractions of one tile). */
export interface FogVeilFrame extends OverlayFrame {
  readonly height: number;
  readonly alpha: number;
  /** Mask scroll offset, tile widths — wraps over 1 (seamless texture). */
  readonly scroll: number;
}

/**
 * Resolve fog veil `index` (of `kit.layers`) at `tSec`. The strip itself
 * is a static full-width band anchored at `anchorLeft` (overscan covers
 * camera pans); the ANIMATION is inside it — the noise mask scrolls at a
 * per-veil speed/direction (alternating sign, golden-ratio phases) so the
 * fibrous matter keeps moving without the veil ever becoming a readable
 * contour; alpha breathes slowly per veil so the field thickens and thins.
 */
export function fogVeilFrame(
  kit: AtmosphereFogKit,
  index: number,
  state: Pick<CameraState, 'zoom' | 'pan'>,
  cfg: QuestDepthFx,
  imgAspect: number,
  viewAspect: number,
  tSec: number,
  phase = 0,
): FogVeilFrame {
  /* Per-veil variation: direction alternates, speed spreads ±40%. */
  const dir = index % 2 === 0 ? 1 : -1;
  const speedMul = 1 + (index % 3) * kit.speedVariation;
  const veilPhase = phase + index * kit.phaseStep;
  const scroll = wrap(dir * kit.speed * speedMul * tSec + veilPhase, 1);
  const sizeMul = 1 + ((index % 3) - 1) * kit.sizeVariation;
  const veilWidth = kit.veilWidth * sizeMul;
  const veilHeight = kit.veilHeight * (2 - sizeMul);
  /* Centre the strip on `anchorLeft` (offset from 0.5) — a veil always
   * spans past both edges, so no ellipse-like contour can ever appear. */
  const xImg = 0.5 + kit.anchorLeft - veilWidth / 2;

  /* Veils spread vertically inside the band, slightly overlapping. */
  const bandH = kit.band[1] - kit.band[0];
  const yRange = Math.max(0, bandH - veilHeight);
  const yImg = kit.band[0] + (yRange * index) / Math.max(1, kit.layers - 1);

  const { vx, vy, vw, vh } = imgToView(xImg, yImg, veilWidth, veilHeight, state, cfg, imgAspect, viewAspect);
  const p = kit.parallax;
  const breathWave = 0.5 + 0.5 * Math.sin((2 * Math.PI * tSec) / kit.breathSec + index * 2.1);
  const breath = kit.breathFloor + (1 - kit.breathFloor) * breathWave;
  return {
    left: xImg * (1 - p) + vx * p,
    top: yImg * (1 - p) + vy * p,
    width: veilWidth * (1 - p) + vw * p,
    height: veilHeight * (1 - p) + vh * p,
    alpha: kit.alpha * breath,
    scroll,
  };
}
