/**
 * PLAN-135 resting-fit math for the mappa2 `/game` camera.
 *
 * Pure world/screen geometry: no Pixi, DOM or React dependency. Screen projection is
 * `(world - pan) * zoom`; `pan` is therefore the world-coordinate origin of the visible frame.
 */

/** Viewport dimensions in CSS px. */
export interface FitViewport {
  width: number;
  height: number;
}

/** Axis-aligned fixed-chrome rectangle in screen CSS px. */
export interface ScreenRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Inclusive-style world bounds used by the painted-map measurements. */
export interface WorldBounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Painted canvas dimensions in world px at 1× scale. */
export interface CanvasSize {
  width: number;
  height: number;
}

/** Apron depth in world px on each side of the painted canvas. */
export interface ApronMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Input of the deterministic resting-camera solver. */
export interface RestingFitInput {
  viewport: FitViewport;
  chromeRects: readonly ScreenRect[];
  landBounds: WorldBounds;
  canvas: CanvasSize;
  apron: ApronMargins;
  /** Extra clearance around fixed chrome, in screen CSS px. */
  chromeGapPx?: number;
}

/** Result of the deterministic resting-camera solver. */
export interface RestingFitResult {
  zoom: number;
  panX: number;
  panY: number;
  zLand: number;
  zFrame: number;
  status: 'LAND_CLEAR' | 'LAND_CLIPPED_BY_CLAMP';
  freeRect: { x: number; y: number; width: number; height: number };
  visibleFrame: WorldBounds;
  visibleFrameRounded: { x0: number; y0: number; x1: number; y1: number };
  projectedLand: WorldBounds;
  apronNeeded: ApronMargins;
  frameSlack: ApronMargins;
  landClipPx: number;
}

interface AxisSolution {
  pan: number;
  clipPx: number;
}

interface LandFitSolution {
  panX: number;
  panY: number;
}

const CLIP_EPSILON_PX = 1e-7;
const positive = (n: number, fallback: number): number => (Number.isFinite(n) && n > 0 ? n : fallback);
const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** Inflate a chrome rect by the requested clearance on every side. */
function expandedChromeRect(rect: ScreenRect, gap: number): ScreenRect {
  return {
    id: rect.id,
    x: rect.x - gap,
    y: rect.y - gap,
    width: rect.width + gap * 2,
    height: rect.height + gap * 2,
  };
}

/**
 * Derive a conservative full-width free rectangle from the live fixed chrome.
 * Upper-half rects reserve space from the top, lower-half rects from the bottom.
 * This remains useful as a diagnostic envelope and as the fallback solver when the
 * apron frame clamp makes the exact land constraint impossible.
 */
export function chromeFreeRect(
  viewport: FitViewport,
  chromeRects: readonly ScreenRect[],
  chromeGapPx = 0,
): RestingFitResult['freeRect'] {
  let top = 0;
  let bottom = 0;
  for (const source of chromeRects) {
    if (source.width <= 0 || source.height <= 0) continue;
    const r = expandedChromeRect(source, chromeGapPx);
    const centerY = r.y + r.height / 2;
    if (centerY < viewport.height / 2) top = Math.max(top, r.y + r.height);
    else bottom = Math.max(bottom, viewport.height - r.y);
  }
  const height = Math.max(1, viewport.height - top - bottom);
  return { x: 0, y: top, width: viewport.width, height };
}

/**
 * Test whether the full land bbox can be placed clear of fixed chrome at a fixed zoom.
 * For every chrome rectangle one of four separating relations is enough: land above,
 * below, left or right. The fixed slots are few, so enumerating those relations is
 * small, exact and deterministic; at a fixed zoom every relation becomes a simple
 * pan interval constraint.
 */
function solveLandAtZoom(args: {
  viewport: FitViewport;
  chromeRects: readonly ScreenRect[];
  landBounds: WorldBounds;
  zoom: number;
  chromeGapPx: number;
  frame?: WorldBounds;
}): LandFitSolution | null {
  const { viewport, chromeRects, landBounds, zoom, chromeGapPx, frame } = args;
  if (!(zoom > 0) || !Number.isFinite(zoom)) return null;

  const baseX = {
    lower: Math.max(landBounds.x1 - viewport.width / zoom, frame?.x0 ?? -Infinity),
    upper: Math.min(landBounds.x0, frame === undefined ? Infinity : frame.x1 - viewport.width / zoom),
  };
  const baseY = {
    lower: Math.max(landBounds.y1 - viewport.height / zoom, frame?.y0 ?? -Infinity),
    upper: Math.min(landBounds.y0, frame === undefined ? Infinity : frame.y1 - viewport.height / zoom),
  };
  const desiredX = (landBounds.x0 + landBounds.x1) / 2 - viewport.width / (2 * zoom);
  const desiredY = (landBounds.y0 + landBounds.y1) / 2 - viewport.height / (2 * zoom);
  const separationCount = 4 ** chromeRects.length;
  let best: (LandFitSolution & { score: number }) | null = null;

  for (let mask = 0; mask < separationCount; mask += 1) {
    let xLower = baseX.lower;
    let xUpper = baseX.upper;
    let yLower = baseY.lower;
    let yUpper = baseY.upper;
    let feasible = true;

    for (let i = 0; i < chromeRects.length; i += 1) {
      const source = chromeRects[i];
      if (source.width <= 0 || source.height <= 0) continue;
      const rect = expandedChromeRect(source, chromeGapPx);
      const separation = ((mask >> (i * 2)) & 3) as 0 | 1 | 2 | 3;
      if (separation === 0) {
        // above: projected land bottom stays over the chrome top edge.
        yLower = Math.max(yLower, landBounds.y1 - rect.y / zoom);
      } else if (separation === 1) {
        // below: projected land top stays under the chrome bottom edge.
        yUpper = Math.min(yUpper, landBounds.y0 - (rect.y + rect.height) / zoom);
      } else if (separation === 2) {
        // left: projected land right edge stays left of chrome.
        xLower = Math.max(xLower, landBounds.x1 - rect.x / zoom);
      } else {
        // right: projected land left edge stays right of chrome.
        xUpper = Math.min(xUpper, landBounds.x0 - (rect.x + rect.width) / zoom);
      }
      if (xLower > xUpper + 1e-10 || yLower > yUpper + 1e-10) {
        feasible = false;
        break;
      }
    }
    if (!feasible) continue;

    const panX = clamp(desiredX, xLower, xUpper);
    const panY = clamp(desiredY, yLower, yUpper);
    const score = (panX - desiredX) ** 2 + (panY - desiredY) ** 2;
    // Strictly lower score wins; equal scores keep the first deterministic mask.
    if (!best || score < best.score - 1e-12) best = { panX, panY, score };
  }

  return best ? { panX: best.panX, panY: best.panY } : null;
}

/** Find the maximum zoom at which the full land bbox is visible and chrome-clear. */
function solveMaximumLandFit(args: {
  viewport: FitViewport;
  chromeRects: readonly ScreenRect[];
  landBounds: WorldBounds;
  chromeGapPx: number;
}): { zoom: number; solution: LandFitSolution | null } {
  const landW = positive(args.landBounds.x1 - args.landBounds.x0, 1);
  const landH = positive(args.landBounds.y1 - args.landBounds.y0, 1);
  const visibilityCap = Math.min(args.viewport.width / landW, args.viewport.height / landH);
  if (!(visibilityCap > 0) || !Number.isFinite(visibilityCap)) return { zoom: 0, solution: null };

  const solve = (zoom: number) => solveLandAtZoom({ ...args, zoom });
  const capSolution = solve(visibilityCap);
  if (capSolution) return { zoom: visibilityCap, solution: capSolution };

  let lower = 0;
  let upper = visibilityCap;
  for (let i = 0; i < 56; i += 1) {
    const mid = (lower + upper) / 2;
    if (solve(mid)) lower = mid;
    else upper = mid;
  }
  return { zoom: lower, solution: solve(lower) };
}

/**
 * Solve one camera axis under two independent constraints: the projected land bbox
 * stays inside the conservative chrome-free screen interval, and the visible frame
 * stays inside the canvas+apron world rect. Used only when the frame clamp wins;
 * void avoidance is favoured and land clipping is reported diagnostically.
 */
function solveAxis(args: {
  landMin: number;
  landMax: number;
  frameMin: number;
  frameMax: number;
  freeMin: number;
  freeMax: number;
  viewportSize: number;
  zoom: number;
}): AxisSolution {
  const visibleWorld = args.viewportSize / args.zoom;
  const landLower = args.landMax - args.freeMax / args.zoom;
  const landUpper = args.landMin - args.freeMin / args.zoom;
  const frameLower = args.frameMin;
  const frameUpper = args.frameMax - visibleWorld;
  const desired = (args.landMin + args.landMax) / 2 - (args.freeMin + (args.freeMax - args.freeMin) / 2) / args.zoom;

  const lower = Math.max(landLower, frameLower);
  const upper = Math.min(landUpper, frameUpper);
  if (lower <= upper) return { pan: clamp(desired, lower, upper), clipPx: 0 };

  const frameOnlyUpper = Math.max(frameLower, frameUpper);
  const pan = clamp(desired, frameLower, frameOnlyUpper);
  const projectedMin = (args.landMin - pan) * args.zoom;
  const projectedMax = (args.landMax - pan) * args.zoom;
  const clipPx = Math.max(0, args.freeMin - projectedMin, projectedMax - args.freeMax);
  return { pan, clipPx };
}

/** Return the largest screen-px overlap extent between projected land and real chrome. */
function measureChromeOverlap(projectedLand: WorldBounds, chromeRects: readonly ScreenRect[]): number {
  let clip = 0;
  for (const rect of chromeRects) {
    if (rect.width <= 0 || rect.height <= 0) continue;
    const overlapX = Math.min(projectedLand.x1, rect.x + rect.width) - Math.max(projectedLand.x0, rect.x);
    const overlapY = Math.min(projectedLand.y1, rect.y + rect.height) - Math.max(projectedLand.y0, rect.y);
    if (overlapX > 0 && overlapY > 0) clip = Math.max(clip, overlapX, overlapY);
  }
  return clip < CLIP_EPSILON_PX ? 0 : clip;
}

/** Compute the resting camera fit and its hard diagnostic state. */
export function restingFit(input: RestingFitInput): RestingFitResult {
  const gap = input.chromeGapPx ?? 0;
  const free = chromeFreeRect(input.viewport, input.chromeRects, gap);
  const landFit = solveMaximumLandFit({
    viewport: input.viewport,
    chromeRects: input.chromeRects,
    landBounds: input.landBounds,
    chromeGapPx: gap,
  });
  const zLand = landFit.zoom;

  const frame = {
    x0: -input.apron.left,
    y0: -input.apron.top,
    x1: input.canvas.width + input.apron.right,
    y1: input.canvas.height + input.apron.bottom,
  };
  const zFrame = Math.max(
    input.viewport.width / Math.max(1, frame.x1 - frame.x0),
    input.viewport.height / Math.max(1, frame.y1 - frame.y0),
  );
  const zoom = Math.max(zLand, zFrame);
  const landClear = zLand + 1e-9 >= zFrame;
  const status: RestingFitResult['status'] = landClear ? 'LAND_CLEAR' : 'LAND_CLIPPED_BY_CLAMP';

  let panX: number;
  let panY: number;
  const frameConstrainedLand = landClear
    ? solveLandAtZoom({
        viewport: input.viewport,
        chromeRects: input.chromeRects,
        landBounds: input.landBounds,
        zoom,
        chromeGapPx: gap,
        frame,
      })
    : null;
  if (landClear && frameConstrainedLand) {
    panX = frameConstrainedLand.panX;
    panY = frameConstrainedLand.panY;
  } else {
    const sx = solveAxis({
      landMin: input.landBounds.x0,
      landMax: input.landBounds.x1,
      frameMin: frame.x0,
      frameMax: frame.x1,
      freeMin: free.x,
      freeMax: free.x + free.width,
      viewportSize: input.viewport.width,
      zoom,
    });
    const sy = solveAxis({
      landMin: input.landBounds.y0,
      landMax: input.landBounds.y1,
      frameMin: frame.y0,
      frameMax: frame.y1,
      freeMin: free.y,
      freeMax: free.y + free.height,
      viewportSize: input.viewport.height,
      zoom,
    });
    panX = sx.pan;
    panY = sy.pan;
  }

  const visibleFrame: WorldBounds = {
    x0: panX,
    y0: panY,
    x1: panX + input.viewport.width / zoom,
    y1: panY + input.viewport.height / zoom,
  };
  const projectedLand: WorldBounds = {
    x0: (input.landBounds.x0 - panX) * zoom,
    y0: (input.landBounds.y0 - panY) * zoom,
    x1: (input.landBounds.x1 - panX) * zoom,
    y1: (input.landBounds.y1 - panY) * zoom,
  };
  const need = (a: number): number => Math.max(0, Math.ceil(a - 1e-9));
  const apronNeeded: ApronMargins = {
    left: need(-visibleFrame.x0),
    right: need(visibleFrame.x1 - input.canvas.width),
    top: need(-visibleFrame.y0),
    bottom: need(visibleFrame.y1 - input.canvas.height),
  };
  const slack = (available: number, required: number): number => Math.max(0, Math.floor(available - required + 1e-9));
  return {
    zoom,
    panX,
    panY,
    zLand,
    zFrame,
    status,
    freeRect: free,
    visibleFrame,
    visibleFrameRounded: {
      x0: Math.floor(visibleFrame.x0),
      y0: Math.floor(visibleFrame.y0),
      x1: Math.ceil(visibleFrame.x1),
      y1: Math.ceil(visibleFrame.y1),
    },
    projectedLand,
    apronNeeded,
    frameSlack: {
      left: slack(input.apron.left, apronNeeded.left),
      right: slack(input.apron.right, apronNeeded.right),
      top: slack(input.apron.top, apronNeeded.top),
      bottom: slack(input.apron.bottom, apronNeeded.bottom),
    },
    landClipPx: measureChromeOverlap(projectedLand, input.chromeRects),
  };
}
