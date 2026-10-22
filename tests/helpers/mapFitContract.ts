/**
 * CTR-game-005 — shared map-fit contract (PLAN-054 T-001).
 *
 * Single source for the constants, the in-page measurement and the verdict
 * logic used by BOTH the Playwright spec (`gameGeometryT01.spec.ts`) and the
 * CLI probe (`scripts/probe-game-map-fit.cjs`). Land bounds, sea margins,
 * insets and stage colour are read from `worldDressing.safeFit`/`worldDressing`
 * in `gameFrameConfig`; the sea-quad pad is read from the renderer module
 * (`pixiSpike/mapFitRuntime`) — nothing here may be re-hardcoded, or the
 * contract silently drifts from the values the renderer actually uses.
 *
 * Contract recap (`src/docs/docs/design/game_map_fit_contract.md`, R-148):
 * the resting camera must frame the protected land inside the area the FIXED
 * chrome leaves free; at the sea-margin pan bounds the deep-sea quads must
 * still cover the whole viewport so the stage colour never leaks a line.
 */
import { PNG } from 'pngjs';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { SEA_QUAD_PAD } from '@/ui/idleVillage/pixiSpike/mapFitRuntime';
import { autoHudScale } from '@/ui/idleVillage/components/gameFrame/hudScale';

const safeFit = DEFAULT_GAME_FRAME_CONFIG.worldDressing.safeFit;

/** Protected land bounding box in world px (source: `worldDressing.safeFit.landBounds`). */
export const MAP_FIT_LAND = safeFit.landBounds;
/** Horizontal pan bound past the canvas edge, world px (`safeFit.seaMarginPx`). */
export const MAP_FIT_MARGIN_X = safeFit.seaMarginPx;
/** Vertical pan bound past the canvas edge, world px (`safeFit.seaMarginYPx`). */
export const MAP_FIT_MARGIN_Y = safeFit.seaMarginYPx ?? 0;
/** Reserved bands for the fixed chrome (`safeFit.insets`; sides are live-computed by the frame). */
export const MAP_FIT_INSETS = safeFit.insets;
/**
 * Chrome bands in DEVICE px for a viewport (`CTR-game-005` R-ultrawide):
 * `safeFit.insets` is declared in HUD layout px; the browser interface-size
 * zoom scales the fixed chrome by `hudScale.cssZoom` (= `autoHudScale` in
 * auto mode — what the page applies). `game-frame-pixi.tsx` reserves the
 * same scaled bands in the `safeFit` prop it passes to `PixiWorldMap`.
 */
export const effectiveFitInsets = (viewport: { w: number; h: number }) => {
  const zoom = autoHudScale(viewport.w, viewport.h);
  return { top: MAP_FIT_INSETS.top * zoom, bottom: MAP_FIT_INSETS.bottom * zoom };
};
/** Extra quad reach past the pan bounds, world px (`mapFitRuntime.SEA_QUAD_PAD`). */
export const MAP_FIT_SEA_QUAD_PAD = SEA_QUAD_PAD;
/** Pixi stage background colour (`worldDressing.stageColor`) — the leak colour the scanline hunts. */
export const MAP_FIT_STAGE_COLOR = DEFAULT_GAME_FRAME_CONFIG.worldDressing.stageColor;
/**
 * World-space landmark the camera hook is calibrated against
 * (`manifest.coordinateSystem.canvas` of the wanderlust base manifest).
 */
export const MAP_FIT_CANVAS = { w: 4240, h: 2828 } as const;

/** Contract viewport matrix (PLAN-054 T-001): short-wide and Steam-Deck sizes where the fit historically lost.
 * `3440x1440` added 2026-10-19 (Director «ultrawide va fixato adesso»): the cssZoom-scaled chrome
 * used to exceed the declared insets — guarded now. */
export const MAP_FIT_VIEWPORTS = [
  { w: 1440, h: 900, label: '1440x900' },
  { w: 1280, h: 800, label: '1280x800' },
  { w: 1920, h: 800, label: '1920x800' },
  { w: 1600, h: 760, label: '1600x760' },
  { w: 1024, h: 700, label: '1024x700' },
  { w: 3440, h: 1440, label: '3440x1440' },
] as const;

export interface MapFitRect {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface MapFitCam {
  panX: number;
  panY: number;
  zoom: number;
  /** World canvas size in world px (`manifest.coordinateSystem.canvas`). */
  width: number;
  height: number;
}

export interface MapFitMeasurement {
  error?: string;
  cam?: MapFitCam;
  land?: { x0: number; y0: number; x1: number; y1: number };
  /** Painted-canvas edges projected to screen px (sea quad reaches `MARGIN + SEA_QUAD_PAD` further out). */
  canvasEdge?: { left: number; right: number; top: number; bottom: number };
  /** Deep-sea quad extent projected to screen px. */
  seaQuad?: { left: number; right: number; top: number; bottom: number };
  hud?: { topPlaques: MapFitRect[]; navPlinth: MapFitRect[]; roster: MapFitRect[]; ledger: MapFitRect[] };
  vw?: number;
  vh?: number;
}

/**
 * In-page measurement. Serialized into the browser by `page.evaluate` on both
 * Playwright and Puppeteer — it MUST stay self-contained: no imports, no
 * closure references, plain JS only.
 */
export function measureMapFitInPage(args: {
  land: { x0: number; x1: number; y0: number; y1: number };
  marginX: number;
  marginY: number;
  seaQuadPad: number;
}): MapFitMeasurement {
  const cam = (window as unknown as { __worldCam?: MapFitCam }).__worldCam;
  if (!cam) return { error: 'no __worldCam' };
  const z = cam.zoom;
  const topPlaques = [...document.querySelectorAll('section')]
    .filter((el) => {
      let p = el.parentElement;
      while (p) {
        if (getComputedStyle(p).display === 'grid') return true;
        p = p.parentElement;
      }
      return false;
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, label: 'top-plaque' };
    });
  const navPlinth: MapFitRect[] = [];
  const navEl = document.querySelector('nav');
  if (navEl) {
    let el = navEl.parentElement;
    while (el && getComputedStyle(el).position !== 'absolute') el = el.parentElement;
    if (el) {
      const r = el.getBoundingClientRect();
      navPlinth.push({ x: r.x, y: r.y, w: r.width, h: r.height, label: 'nav-plinth' });
    }
  }
  return {
    cam,
    land: {
      x0: (args.land.x0 - cam.panX) * z,
      y0: (args.land.y0 - cam.panY) * z,
      x1: (args.land.x1 - cam.panX) * z,
      y1: (args.land.y1 - cam.panY) * z,
    },
    canvasEdge: {
      left: (0 - cam.panX) * z,
      right: (cam.width - cam.panX) * z,
      top: (0 - cam.panY) * z,
      bottom: (cam.height - cam.panY) * z,
    },
    seaQuad: {
      left: (-args.marginX - args.seaQuadPad - cam.panX) * z,
      right: (cam.width + args.marginX + args.seaQuadPad - cam.panX) * z,
      top: (-args.marginY - args.seaQuadPad - cam.panY) * z,
      bottom: (cam.height + args.marginY + args.seaQuadPad - cam.panY) * z,
    },
    hud: {
      topPlaques,
      navPlinth,
      roster: [...document.querySelectorAll('[data-testid="resident-roster-panel"]')].map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, label: 'roster' };
      }),
      ledger: [...document.querySelectorAll('section')]
        .filter((el) => el.closest('.game-frame') && el.getBoundingClientRect().x > window.innerWidth * 0.5 && el.getBoundingClientRect().y > 120)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height, label: el.getAttribute('aria-label') || 'section-right' };
        }),
    },
    vw: window.innerWidth,
    vh: window.innerHeight,
  };
}

/** Convenience bundle of the constants the in-page measurement needs. */
export const MAP_FIT_MEASURE_ARGS = {
  land: MAP_FIT_LAND,
  marginX: MAP_FIT_MARGIN_X,
  marginY: MAP_FIT_MARGIN_Y,
  seaQuadPad: MAP_FIT_SEA_QUAD_PAD,
} as const;

const intersect = (a: { x0: number; y0: number; x1: number; y1: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x0 < b.x + b.w && a.x1 > b.x && a.y0 < b.y + b.h && a.y1 > b.y;

export interface MapFitVerdict {
  ok: boolean;
  /** Anti-vacuous check failures — the measurement itself is not trustworthy. */
  precheck: string[];
  /** Fixed chrome rectangles intersecting the protected land (must be empty). */
  fixedChromeViolations: string[];
  /** Sea quad does not cover the whole viewport — stage leak is geometrically possible. */
  seaCoverageViolations: string[];
  /** Land bottom edge dips into the bottom chrome band (south-pin broken). */
  southPinViolation: string | null;
  /** Floating panels over land (allowed — reported for the log only). */
  panelsOverLand: string[];
}

/**
 * Evaluate one measurement against CTR-game-005. `southPinTol` is the px
 * slack on the bottom free-area boundary (sub-pixel fit + DPR rounding).
 */
export function evaluateMapFit(
  m: MapFitMeasurement,
  viewport: { w: number; h: number },
  opts: { southPinTol?: number } = {},
): MapFitVerdict {
  const precheck: string[] = [];
  if (m.error) precheck.push(`measure error: ${m.error}`);
  if (!m.cam) precheck.push('__worldCam missing');
  if (!m.land || !m.canvasEdge || !m.hud) precheck.push('incomplete measurement');
  if (m.cam && (m.cam.width !== MAP_FIT_CANVAS.w || m.cam.height !== MAP_FIT_CANVAS.h))
    precheck.push(`worldCam canvas ${m.cam.width}x${m.cam.height} != calibrated landmark ${MAP_FIT_CANVAS.w}x${MAP_FIT_CANVAS.h}`);
  if (m.cam && m.cam.zoom <= 0) precheck.push(`worldCam zoom ${m.cam.zoom} is not positive`);
  const topPlaques = m.hud?.topPlaques ?? [];
  const navPlinth = m.hud?.navPlinth ?? [];
  if (topPlaques.length < 2) precheck.push(`topPlaques ${topPlaques.length} < 2`);
  if (navPlinth.length !== 1) precheck.push(`navPlinth ${navPlinth.length} !== 1`);
  if (precheck.length > 0) {
    return { ok: false, precheck, fixedChromeViolations: [], seaCoverageViolations: [], southPinViolation: null, panelsOverLand: [] };
  }
  const land = m.land!;
  const fixedChromeViolations = [...topPlaques, ...navPlinth].filter((r) => intersect(land, r)).map((r) => r.label);
  const panelsOverLand = [...(m.hud!.roster ?? []), ...(m.hud!.ledger ?? [])].filter((r) => intersect(land, r)).map((r) => r.label);
  const seaCoverageViolations: string[] = [];
  const quad = m.seaQuad;
  if (quad) {
    if (quad.left > 0) seaCoverageViolations.push(`seaQuad.left ${quad.left.toFixed(1)} > 0`);
    if (quad.right < viewport.w) seaCoverageViolations.push(`seaQuad.right ${quad.right.toFixed(1)} < ${viewport.w}`);
    if (quad.top > 0) seaCoverageViolations.push(`seaQuad.top ${quad.top.toFixed(1)} > 0`);
    if (quad.bottom < viewport.h) seaCoverageViolations.push(`seaQuad.bottom ${quad.bottom.toFixed(1)} < ${viewport.h}`);
  } else {
    seaCoverageViolations.push('seaQuad missing from measurement');
  }
  const tol = opts.southPinTol ?? 6;
  /* The band the land may not dip into is the REAL chrome height — the
   * declared inset scaled by the interface-size zoom (ultrawide ruling). */
  const bottomBand = effectiveFitInsets(viewport).bottom;
  const southPinViolation = land.y1 > viewport.h - bottomBand + tol
    ? `land.y1 ${land.y1.toFixed(1)} dips ${(land.y1 - (viewport.h - bottomBand)).toFixed(1)}px into the bottom chrome band (scaled ${bottomBand.toFixed(0)}px)`
    : null;
  return {
    ok: precheck.length === 0 && fixedChromeViolations.length === 0 && seaCoverageViolations.length === 0 && !southPinViolation,
    precheck,
    fixedChromeViolations,
    seaCoverageViolations,
    southPinViolation,
    panelsOverLand,
  };
}

export interface ScanlineFinding {
  kind: 'stage-leak' | 'canvas-edge-seam';
  detail: string;
}

export interface ScanlineResult {
  ok: boolean;
  findings: ScanlineFinding[];
  metrics: { stageLeakRuns: number; edgeSeamRows: number; edgeSeamCols: number; sampledRows: number };
}

/**
 * Pixel-level check on a viewport screenshot (PNG, CSS px — decode with pngjs):
 * 1. `stage-leak` — a run of ≥8 consecutive pixels within RGB distance ≤2 of
 *    `stageColor` in the outermost 3-px border strip **and outside the projected
 *    sea quad** (a covered pixel is painted texture, not a leak — far-sea
 *    flattens into the stage colour's ±2 window at ultrawide). A leak is the
 *    FLAT clear colour (the stage was deliberately tinted sea-teal `#489397`,
 *    so painted
 *    sea pixels can sit within ~±12 of it — an exact-match run is the only
 *    honest leak signature; texture/dither never holds ±2 for a long run).
 * 2. `canvas-edge-seam` — a sustained hard step (luminance jump > 48) across the
 *    projected painted-canvas edge, where the old/new sea tiles used to split
 *    (the historical "line between old sea and new sea" of R-148).
 */
export function scanlineCheckPng(
  png: PNG,
  m: MapFitMeasurement,
  stageColorHex: string,
): ScanlineResult {
  const findings: ScanlineFinding[] = [];
  const stage = hexToRgb(stageColorHex);
  const at = (x: number, y: number) => {
    const i = (png.width * y + x) << 2;
    return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
  };
  const lum = (x: number, y: number) => {
    const c = at(x, y);
    return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  };
  const nearStage = (x: number, y: number) => {
    const c = at(x, y);
    return Math.abs(c.r - stage.r) <= 2 && Math.abs(c.g - stage.g) <= 2 && Math.abs(c.b - stage.b) <= 2;
  };

  // A border pixel is a real leak only if no painted quad covers it: where the
  // sea quad reaches, the rasterised pixel belongs to the texture — and far-sea
  // flattens to a tone within ±2 of the stage colour, which would otherwise be
  // a false positive (observed at 3440×1440). A missing quad rect means the
  // measurement was incomplete: fail closed and treat everything as uncovered.
  const quad = m.seaQuad;
  const uncovered = (x: number, y: number) =>
    !quad || x < quad.left || x > quad.right || y < quad.top || y > quad.bottom;

  let stageLeakRuns = 0;
  const maxRun = (samples: number, near: (i: number) => boolean) => {
    let run = 0;
    let best = 0;
    for (let i = 0; i < samples; i++) {
      run = near(i) ? run + 1 : 0;
      if (run > best) best = run;
    }
    return best;
  };
  const strip = 3;
  for (let y = 0; y < strip; y++) {
    const r = maxRun(png.width, (x) => nearStage(x, y) && uncovered(x, y));
    if (r >= 8) stageLeakRuns += r;
  }
  for (let y = png.height - strip; y < png.height; y++) {
    const r = maxRun(png.width, (x) => nearStage(x, y) && uncovered(x, y));
    if (r >= 8) stageLeakRuns += r;
  }
  for (let x = 0; x < strip; x++) {
    const r = maxRun(png.height, (y) => nearStage(x, y) && uncovered(x, y));
    if (r >= 8) stageLeakRuns += r;
  }
  for (let x = png.width - strip; x < png.width; x++) {
    const r = maxRun(png.height, (y) => nearStage(x, y) && uncovered(x, y));
    if (r >= 8) stageLeakRuns += r;
  }
  if (stageLeakRuns > 0)
    findings.push({ kind: 'stage-leak', detail: `${stageLeakRuns}px of stage colour ${stageColorHex} in the 3px border strip` });

  const y0 = Math.floor(png.height * 0.3);
  const y1 = Math.floor(png.height * 0.7);
  const x0 = Math.floor(png.width * 0.3);
  const x1 = Math.floor(png.width * 0.7);
  const edge = m.canvasEdge;
  let edgeSeamRows = 0;
  let edgeSeamCols = 0;
  if (edge) {
    for (const side of [edge.left, edge.right]) {
      const x = Math.round(side);
      if (x < 8 || x > png.width - 9) continue;
      let steps = 0;
      for (let y = y0; y <= y1; y++) if (Math.abs(lum(x - 1, y) - lum(x + 1, y)) > 48) steps++;
      if (steps > (y1 - y0) * 0.5) {
        edgeSeamCols += steps;
        findings.push({ kind: 'canvas-edge-seam', detail: `hard step across canvasEdge x=${x}: ${steps}/${y1 - y0} rows with ΔL>48` });
      }
    }
    for (const side of [edge.top, edge.bottom]) {
      const y = Math.round(side);
      if (y < 8 || y > png.height - 9) continue;
      let steps = 0;
      for (let x = x0; x <= x1; x++) if (Math.abs(lum(x, y - 1) - lum(x, y + 1)) > 48) steps++;
      if (steps > (x1 - x0) * 0.5) {
        edgeSeamRows += steps;
        findings.push({ kind: 'canvas-edge-seam', detail: `hard step across canvasEdge y=${y}: ${steps}/${x1 - x0} cols with ΔL>48` });
      }
    }
  }
  return { ok: findings.length === 0, findings, metrics: { stageLeakRuns, edgeSeamRows, edgeSeamCols, sampledRows: y1 - y0 } };
}

const hexToRgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});
