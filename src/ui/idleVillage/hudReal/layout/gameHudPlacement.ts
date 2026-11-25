/**
 * Where /game draws its three signed bars (time, resources, nav) for a window — pure, unit-tested.
 *
 * - From 768 px wide: the signed blueprint B1 (`resolveSlots`, game HUD zoom). Each integral bar is scaled whole to its
 *   slot width (PLAN-112 §28) — same placement maths as `/hud-compose`.
 * - Below 768 px (D10: the blueprint does not apply on phones): the same bars, stacked so nothing overlaps — resources
 *   on top, time under the resources bar, nav at the bottom — each scaled down only as much as the width needs.
 * - Landscape windows shorter than `LANDSCAPE_MAX_H` (phones rotated, ~360–430 px tall) get a miniature of the reference
 *   desktop layout instead: every bar keeps its own share of the window measured on the signed blueprint at 1920×1080
 *   (Director 2026-11-14, R-332: the game is played horizontally on phones; "stessa percentuale... la mantieni uguale").
 *   The nav is bottom-anchored — the blueprint's tip overhang would slip off the short window.
 *
 * `textK` = 1 / bar scale: the page sets it as `--hud-text-k` so the bar's text keeps its designed px (`hudPx`) instead of
 * shrinking with the art. The game HUD zoom (>= 1) is NOT compensated: it is meant to enlarge everything.
 */
import { blueprintMode, frameFor, M, resolveAll, resolveSlots, SLOTS_B, TOP_ROW_H, type Frame } from './hudLayoutB';

/** Intrinsic design size of each integral bar and the y of its socket row (where it is centred on its slot). */
export const GAME_HUD_BARS = {
  time: { w: 485.34, h: 84.96, rowY: 44.5 },
  /* R-376: regenerated pointed-cap bar (no medallion/pendant) — 917×150 asset. */
  resources: { w: 458.6, h: 75.15, rowY: 37.9 },
  nav: { w: 513, h: 131.25 },
  /* R-338: the narrator piece (voce/piece.webp) is 440×230.56 design px; its slot (360 wide,
   *  blueprint B1 'voce') only reserves its lower band — the art overflows upward, bottom edge
   *  VOCE_BOTTOM px above the screen's, same as the nav (Director ruling, /hud-compose). */
  voce: { w: 440, h: 230.56 },
} as const;

/** The narrator's lowest point sits this far above the bottom edge (like NAV_BOTTOM). */
const VOCE_BOTTOM = 6;

/** Phone margins: side gutter and gap between stacked bars. */
const PHONE_SIDE = 8;
const PHONE_GAP = 4;
/** The nav's lowest point sits this far above the bottom edge (Director, /hud-compose). */
const NAV_BOTTOM = 6;
/** Landscape windows shorter than this are rotated phones: they get the percentage miniature, not the blueprint
 *  (a landscape phone is ~360–430 px tall; landscape tablets start at ~744 px and keep the blueprint). */
const LANDSCAPE_MAX_H = 560;
/** The nav dock renders at this share of its fit scale, so its height sits in the top bars' family
 *  (Director 2026-11-24, HUD critique run: «proporzionato a quelli sopra» — ~75%: nav ≈ 98 px against
 *  the 75–85 px time/resources bars). Applied to every placement path; bottom anchoring and centring
 *  are unchanged — the dock shrinks upward and keeps its slot centre. */
const NAV_ART_PROPORTION = 0.75;
/** Reference desktop window the landscape miniature's percentages are measured on. */
const REF = { W: 1920, H: 1080 };

export interface BarPlacement { left: number; top: number; scale: number; textK: number }
export interface GameHudPlacement {
  mode: 'blueprint' | 'phone' | 'landscape';
  /** Scale for the corner round buttons (bottom-right cluster) — the bars' own scale on the landscape miniature. */
  cornerScale: number;
  /** Design px the nav's outer labels move outwards (phones: the compensated labels would touch). */
  navLabelSpread: number;
  /** Canvas the bars are placed in (the page scales it by `frame.scale`). */
  frame: Frame;
  time: BarPlacement;
  resources: BarPlacement;
  nav: BarPlacement;
  /** The narrator's slot rect where the blueprint applies; phones have no signed layout for it (R-338). */
  voce?: BarPlacement;
}

const bar = (left: number, top: number, scale: number): BarPlacement => ({ left, top, scale, textK: 1 / scale });

export function placeGameHud(winW: number, winH: number, zoom: number): GameHudPlacement {
  if (winW > winH && winH < LANDSCAPE_MAX_H) return placeLandscape(winW, winH, zoom);
  if (blueprintMode(winW) === 'base-fallback') {
    const frame: Frame = { scale: 1, W: winW, H: winH };
    const fit = (w: number, side: number) => Math.min(1, (winW - 2 * side) / w);
    const sR = fit(GAME_HUD_BARS.resources.w, PHONE_SIDE);
    const sT = fit(GAME_HUD_BARS.time.w, PHONE_SIDE);
    const sN = fit(GAME_HUD_BARS.nav.w, PHONE_SIDE - 2) * NAV_ART_PROPORTION;
    const resourcesTop = PHONE_SIDE;
    const timeTop = resourcesTop + GAME_HUD_BARS.resources.h * sR + PHONE_GAP; // under the bar's lower edge
    return {
      mode: 'phone',
      cornerScale: 1,
      navLabelSpread: 18,
      frame,
      resources: bar((winW - GAME_HUD_BARS.resources.w * sR) / 2, resourcesTop, sR),
      time: bar((winW - GAME_HUD_BARS.time.w * sT) / 2, timeTop, sT),
      nav: bar((winW - GAME_HUD_BARS.nav.w * sN) / 2, winH - NAV_BOTTOM - GAME_HUD_BARS.nav.h * sN, sN),
    };
  }
  return placeHudBlueprint(winW, winH, zoom);
}

/** The signed blueprint B1 layout (>= 768 px and taller landscape windows). Exported for tests and the
 *  landscape miniature, which reuses its per-bar text compensation. */
export function placeHudBlueprint(winW: number, winH: number, zoom: number): GameHudPlacement {
  const frame = frameFor(winW, winH, zoom);
  const resolved = resolveSlots(frame);
  const r = resolveAll(resolved.slots, frame);
  const sR = r.resources.w / GAME_HUD_BARS.resources.w;
  const sN = (r.nav.w / GAME_HUD_BARS.nav.w) * NAV_ART_PROPORTION;
  const resources = bar(r.resources.x, r.resources.y + r.resources.h / 2 - GAME_HUD_BARS.resources.rowY * sR, sR);
  /* /game ruling (Director 2026-11-12, R-325): the time bar keeps the page's horizontal centre at EVERY blueprint
   *  width — the signed reflow that parks it under the resources, right-aligned, does not apply on this page.
   *  It drops below the resources row (art + hanging gem) only when centring it on the top row would overlap
   *  the resources art; under the drop it keeps the reflowed scale (aligned to the resources width) and stays
   *  centred. */
  const timeTopSlotW = SLOTS_B.find((s) => s.id === 'time')!.w;
  const sTTop = timeTopSlotW / GAME_HUD_BARS.time.w;
  const timeArtW = GAME_HUD_BARS.time.w * sTTop;
  const centeredLeft = (frame.W - timeArtW) / 2;
  const resArtX0 = r.resources.x;
  const resArtX1 = r.resources.x + GAME_HUD_BARS.resources.w * sR;
  const crowdedTop = centeredLeft + timeArtW > resArtX0 - PHONE_GAP && centeredLeft < resArtX1 + PHONE_GAP;
  const drop = resolved.topReflow && crowdedTop;
  const sT = drop ? r.time.w / GAME_HUD_BARS.time.w : sTTop;
  const timeLeft = drop ? (frame.W - r.time.w) / 2 : centeredLeft;
  const timeTop = drop
    ? resources.top + GAME_HUD_BARS.resources.h * sR + PHONE_GAP
    : M + TOP_ROW_H / 2 - GAME_HUD_BARS.time.rowY * sT;
  /* The narrator hugs the slot's left edge and lets the tall art rise above the reserved band
   *  (same maths as /hud-compose: bottom of the 440-wide piece VOCE_BOTTOM px from the edge). */
  const sV = r.voce.w / GAME_HUD_BARS.voce.w;
  return {
    mode: 'blueprint',
    /* Director 2026-11-24 («dovrebbero essere proporzionati»): the corner discs shrink by the
     *  same proportion as the nav dock — landscape's cornerScale = sN already ties them together. */
    cornerScale: NAV_ART_PROPORTION,
    navLabelSpread: 8, // compensated labels: keep «Workshop» and «Tavern» visibly apart
    frame,
    time: bar(timeLeft, timeTop, sT),
    resources,
    /* Centre kept where the un-proportioned dock put it (x + w − 230); the bar shrinks around it. */
    nav: bar(r.nav.x + r.nav.w - 230 - (GAME_HUD_BARS.nav.w * sN) / 2, frame.H - NAV_BOTTOM - GAME_HUD_BARS.nav.h * sN, sN),
    voce: bar(r.voce.x, frame.H - VOCE_BOTTOM - GAME_HUD_BARS.voce.h * sV, sV),
  };
}

/** The blueprint layout at the reference desktop window — the percentages the landscape miniature reproduces. */
let refPlacement: GameHudPlacement | undefined;
const reference = (): GameHudPlacement => (refPlacement ??= placeHudBlueprint(REF.W, REF.H, 1));

/**
 * Landscape phone: a miniature of the signed desktop layout — every bar keeps its own share of the window
 * (left/top/width as a percentage of the 1920×1080 reference), so the bars' mutual proportions stay the
 * production ones (R-332). The nav is bottom-anchored instead of keeping the blueprint's bottom overhang,
 * whose tip would slip off a ~390 px tall window.
 * Text keeps the compensation the blueprint itself would apply at this window — not `1/scale`: at ~0.4
 * art scale the full compensation would leave the text far bigger than the miniaturised bars.
 */
function placeLandscape(winW: number, winH: number, zoom: number): GameHudPlacement {
  const ref = reference();
  const bp = placeHudBlueprint(winW, winH, zoom);
  const kx = winW / REF.W;
  const ky = winH / REF.H;
  const mini = (p: BarPlacement, textK: number): BarPlacement => {
    const s = p.scale * kx;
    return { left: p.left * kx, top: p.top * ky, scale: s, textK };
  };
  const resources = mini(ref.resources, bp.resources.textK);
  const time = mini(ref.time, bp.time.textK);
  const sN = ref.nav.scale * kx;
  const sV = (ref.voce?.scale ?? 0) * kx;
  return {
    mode: 'landscape',
    cornerScale: sN,
    navLabelSpread: 18, // small scales: the compensated labels need the phone spread
    frame: { scale: 1, W: winW, H: winH },
    resources,
    time,
    nav: { left: ref.nav.left * kx, top: winH - NAV_BOTTOM - GAME_HUD_BARS.nav.h * sN, scale: sN, textK: bp.nav.textK },
    voce: ref.voce ? { left: ref.voce.left * kx, top: winH - VOCE_BOTTOM - GAME_HUD_BARS.voce.h * sV, scale: sV, textK: bp.voce!.textK } : undefined,
  };
}
