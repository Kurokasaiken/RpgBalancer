/**
 * Where /game draws its three signed bars (time, resources, nav) for a window — pure, unit-tested.
 *
 * - From 768 px wide: the signed blueprint B1 (`resolveSlots`, game HUD zoom). Each integral bar is scaled whole to its
 *   slot width (PLAN-112 §28) — same placement maths as `/hud-compose`.
 * - Below 768 px (D10: the blueprint does not apply on phones): the same bars, stacked so nothing overlaps — resources
 *   on top, time under the resources' hanging gem, nav at the bottom — each scaled down only as much as the width needs.
 *
 * `textK` = 1 / bar scale: the page sets it as `--hud-text-k` so the bar's text keeps its designed px (`hudPx`) instead of
 * shrinking with the art. The game HUD zoom (>= 1) is NOT compensated: it is meant to enlarge everything.
 */
import { blueprintMode, frameFor, resolveAll, resolveSlots, type Frame } from './hudLayoutB';

/** Intrinsic design size of each integral bar and the y of its socket row (where it is centred on its slot). */
export const GAME_HUD_BARS = {
  time: { w: 485.34, h: 84.96, rowY: 44.5 },
  resources: { w: 395.79, h: 118.86, rowY: 44.3 },
  nav: { w: 513, h: 131.25 },
} as const;

/** Phone margins: side gutter and gap between stacked bars. */
const PHONE_SIDE = 8;
const PHONE_GAP = 4;
/** The nav's lowest point sits this far above the bottom edge (Director, /hud-compose). */
const NAV_BOTTOM = 6;

export interface BarPlacement { left: number; top: number; scale: number; textK: number }
export interface GameHudPlacement {
  mode: 'blueprint' | 'phone';
  /** Design px the nav's outer labels move outwards (phones: the compensated labels would touch). */
  navLabelSpread: number;
  /** Canvas the bars are placed in (the page scales it by `frame.scale`). */
  frame: Frame;
  time: BarPlacement;
  resources: BarPlacement;
  nav: BarPlacement;
}

const bar = (left: number, top: number, scale: number): BarPlacement => ({ left, top, scale, textK: 1 / scale });

export function placeGameHud(winW: number, winH: number, zoom: number): GameHudPlacement {
  if (blueprintMode(winW) === 'base-fallback') {
    const frame: Frame = { scale: 1, W: winW, H: winH };
    const fit = (w: number, side: number) => Math.min(1, (winW - 2 * side) / w);
    const sR = fit(GAME_HUD_BARS.resources.w, PHONE_SIDE);
    const sT = fit(GAME_HUD_BARS.time.w, PHONE_SIDE);
    const sN = fit(GAME_HUD_BARS.nav.w, PHONE_SIDE - 2);
    const resourcesTop = PHONE_SIDE;
    const timeTop = resourcesTop + GAME_HUD_BARS.resources.h * sR + PHONE_GAP; // under the hanging gem
    return {
      mode: 'phone',
      navLabelSpread: 18,
      frame,
      resources: bar((winW - GAME_HUD_BARS.resources.w * sR) / 2, resourcesTop, sR),
      time: bar((winW - GAME_HUD_BARS.time.w * sT) / 2, timeTop, sT),
      nav: bar((winW - GAME_HUD_BARS.nav.w * sN) / 2, winH - NAV_BOTTOM - GAME_HUD_BARS.nav.h * sN, sN),
    };
  }
  const frame = frameFor(winW, winH, zoom);
  const resolved = resolveSlots(frame);
  const r = resolveAll(resolved.slots, frame);
  const sT = r.time.w / GAME_HUD_BARS.time.w;
  const sR = r.resources.w / GAME_HUD_BARS.resources.w;
  const sN = r.nav.w / GAME_HUD_BARS.nav.w;
  const resources = bar(r.resources.x, r.resources.y + r.resources.h / 2 - GAME_HUD_BARS.resources.rowY * sR, sR);
  // top reflow (D6b: time under the resources, same right edge): the resources art hangs a gem below its 56 px row, so the
  // time bar starts under the art, not under the row — otherwise the gem covers its left disc (seen at 820 px wide)
  const timeTop = resolved.topReflow
    ? resources.top + GAME_HUD_BARS.resources.h * sR + PHONE_GAP
    : r.time.y + r.time.h / 2 - GAME_HUD_BARS.time.rowY * sT;
  return {
    mode: 'blueprint',
    navLabelSpread: 8, // compensated labels: keep «Workshop» and «Tavern» visibly apart
    frame,
    time: bar(r.time.x, timeTop, sT),
    resources,
    nav: bar(r.nav.x + (r.nav.w - 460) / 2, frame.H - NAV_BOTTOM - GAME_HUD_BARS.nav.h * sN, sN),
  };
}
