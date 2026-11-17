/**
 * GameTopChrome — the slim docked top chrome of /game
 * (R-339 / PLAN-119 T6, mw-debate `20261115-wanderlust-ui-plan`
 * artifact-r004: D3 two separate slimmer elements shifted LEFT, Director
 * ruling D10 2026-11-15 — the top-right zone is RESERVED for the future
 * docked Chronicle surface; no hanging tab. R-350, Director 2026-11-15:
 * the resource bar sits on the frame's absolute horizontal centre).
 *
 * Two of the signed slim bars (generated `bar-slim.webp` art, PLAN-112 F4)
 * kept as ONE adjacent pair: the resource bar centred on `frame.W / 2`,
 * the day banner (phase sun/moon dial seated in the emerald via
 * `timeOfDay.dialSlim`) seated flush to its left (`gapPx` apart). The
 * pair's left edge never passes the bound one `topChrome.marginPx` right
 * of whatever the left dock publishes (`insets.left`, currently unowned —
 * the Roster|Stash rail was reverted 2026-11-15). Never an overlay: the
 * chrome publishes its real occupancy into the shared `useGameLayoutInsets`
 * ledger (`top` = margin + row height × fit, 0 when hidden) so the
 * free-rect math always subtracts it.
 *
 * One shared `fit` scales both bars — never past 1, and down only to keep
 * the pair inside the left bound and the bar's right edge inside the
 * Chronicle reserve (`topChrome.chronicleReservePx`, real px — a soft
 * bound: below `topChrome.minFitScale` the reserve yields). The hard
 * bounds are the left bound and the window edge: the chrome never
 * overflows the screen.
 *
 * Bars render at `fit` scale inside the HUD zoom layer; `--hud-text-k = 1/fit`
 * keeps the text at its designed px, the same compensation the full bars get
 * (T8/narrow and phone layouts keep their own stacked chrome — this surface
 * is blueprint-mode only).
 */
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HudRealTimeConnected } from '@/ui/idleVillage/hudReal/HudRealTimeConnected';
import { HudRealResources } from '@/ui/idleVillage/hudReal/HudRealResources';
import { TIME_SLIM_BAR } from '@/ui/idleVillage/hudReal/timeSlimGeometry';
import { RESOURCES_SLIM_BAR } from '@/ui/idleVillage/hudReal/resourcesSlimGeometry';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import type { Frame } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';
import type { ResourceReadoutItem } from './ResourceReadout';

const TC = CASSETTO_LAYOUT_CONFIG.topChrome;
const RES_SLIM_ASSET = '/assets/ui/hud-real/resources/bar-slim.webp';
/* R-352: the resource bar renders at RES_K so its capsule (the plain band,
 *  ornaments ignored — `topChrome.capsulePx`, measured on the signed art)
 *  matches the banner's; and its right filigree cap is mirrored onto the
 *  left edge so the bar reads specular end-to-end — and the cap "seats"
 *  are SYMMETRIC: the left seat equals the right's ornament width
 *  (`resCapMirror.seatPx`), so the medallion is cut, not just covered. */
const RES_K = TC.capsulePx.time / TC.capsulePx.resources;
/* The left cap is ONE flipped slice — the Director picked the exact
 *  source/dest rect in the cap-mirror lab (`topChrome.resCapMirror`).
 *  Only `seatPx` of it shows (the ornament end, matching the right cap's
 *  ~26px seat): art+slots shift LEFT by `RES_SHIFT` (negative) so slot 0's
 *  glass starts exactly where the seat ends — equal cap seats, specular. */
const RES_CAP = TC.resCapMirror;
const RES_SHIFT = RES_CAP.seatPx - RESOURCES_SLIM_BAR.slots[0].x;
const RES_BAR_W = RESOURCES_SLIM_BAR.w + RES_SHIFT;
const RES_W = RES_BAR_W * RES_K;
const RES_H = RESOURCES_SLIM_BAR.h * RES_K;
/** Row height = the tallest bar (the resources' pendant still dips lowest). */
const ROW_H = Math.max(TIME_SLIM_BAR.h, RES_H);

export interface GameTopChromeProps {
  /** Resource chips — the page's `buildResourceReadoutItems` output. */
  items: ResourceReadoutItem[];
  /** Time input lock (quest window, menus, event theatre freeze). */
  locked?: boolean;
  /** Host visibility — the page folds it with the HUD hide toggle. */
  visible?: boolean;
  /** The HUD frame the page resolved for blueprint mode (design px + zoom). */
  frame: Frame;
}

export const GameTopChrome: React.FC<GameTopChromeProps> = ({ items, locked = false, visible = true, frame }) => {
  const { t } = useTranslation('idleVillage');
  const leftInset = useGameLayoutInsets((s) => s.insets.left);
  const publish = useGameLayoutInsets((s) => s.publish);
  const scale = frame.scale;

  /* Left bound: one margin right of whatever the left side publishes
   *  (a left-docked surface, or nothing) — insets are real px, the
   *  frame works in design px. */
  const leftBound = leftInset / scale + TC.marginPx;
  /* The day banner docks at `bannerMarginPx` (Director pick — breathing
   *  room at the left edge), never inside whatever the left side
   *  publishes. The resource bar centres on `frame.W / 2` independently. */
  const bannerDock = Math.max(TC.bannerMarginPx, leftBound);
  /* R-350: the resource bar centres on `frame.W / 2`; the banner is
   *  docked at `bannerDock`, decoupled. One shared `fit` — never past 1 —
   *  keeps banner right + gapPx at or left of the bar's left edge
   *  (fit ≤ overlapFit) and, while it stays ≥ `minFitScale`, the bar's
   *  right edge out of the Chronicle reserve (fit ≤ reserveFit); below
   *  that the reserve yields and the window edge (`frame.W - marginPx`
   *  each side) is the only hard bound — the chrome never overflows. */
  const overlapFit =
    (frame.W - 2 * (bannerDock + TC.gapPx)) / (2 * TIME_SLIM_BAR.w + RES_W);
  const reserveFit = (frame.W - (2 * TC.chronicleReservePx) / scale) / RES_W;
  const screenFit = (frame.W - 2 * TC.marginPx) / RES_W;
  const fitReserved = Math.min(1, overlapFit, reserveFit);
  const fit =
    fitReserved >= TC.minFitScale
      ? fitReserved
      : Math.max(0, Math.min(1, overlapFit, screenFit));
  /* Centred bar's left edge; the banner sits at its own dock —
   *  `fit ≤ overlapFit` is exactly banner right + gapPx ≤ bar left. */
  const resLeft = (frame.W - RES_W * fit) / 2;
  const bannerLeft = bannerDock;

  /* Honest occupancy (real px): top margin + the scaled row height. */
  const occupiedTop = visible ? (TC.marginPx + ROW_H * fit) * scale : 0;
  useEffect(() => {
    publish({ top: occupiedTop });
    return () => publish({ top: 0 });
  }, [occupiedTop, publish]);

  if (!visible) return null;

  /* One full-width band; each bar sits at its own left edge, vertically
   *  centred in the scaled row. */
  const barSlot = (w: number, h: number, slotLeft: number): React.CSSProperties => ({
    position: 'absolute', left: slotLeft, top: ((ROW_H - h) * fit) / 2, width: w * fit, height: h * fit,
  });
  const barInner = (w: number, h: number, k = 1): React.CSSProperties => ({ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${fit * k})`, transformOrigin: 'top left' });

  return (
    <div
      data-testid="game-top-chrome"
      role="group"
      aria-label={t('gameFrame.topChrome.ariaLabel')}
      style={{
        position: 'absolute',
        left: 0,
        top: TC.marginPx,
        width: frame.W,
        height: ROW_H * fit,
        zIndex: 5,
        pointerEvents: 'none',
        ['--hud-text-k' as string]: String(fit > 0 ? 1 / fit : 1),
      }}
    >
      {/* Day banner — slim bar, phase sun/moon dial seated in the emerald
       *  (the mockup's sun ornament, config-driven via `timeOfDay.dialSlim`). */}
      <div data-hudslot="time" data-testid="chrome-day-banner" style={{ ...barSlot(TIME_SLIM_BAR.w, TIME_SLIM_BAR.h, bannerLeft), pointerEvents: 'auto' }}>
        <div style={barInner(TIME_SLIM_BAR.w, TIME_SLIM_BAR.h)}>
          <HudRealTimeConnected locked={locked} slim />
        </div>
      </div>
      {/* Resource bar — slim bar, centred on the frame's horizontal centre
       *  (R-350), compact chips for the narrower slots; R-352: RES_K matches
       *  its capsule to the banner's and the mirrored right cap makes the
       *  bar specular end-to-end. */}
      <div data-hudslot="resources" data-testid="chrome-resources" style={{ ...barSlot(RES_W, RES_H, resLeft), pointerEvents: 'auto', ['--hud-text-k' as string]: String(fit * RES_K > 0 ? 1 / (fit * RES_K) : 1) }}>
        <div style={{ ...barInner(RES_BAR_W, RESOURCES_SLIM_BAR.h, RES_K), overflow: 'hidden' }}>
          <style>{'[data-hudslot="resources"] [data-hr-res]{z-index:2}'}</style>
          <div style={{ position: 'absolute', left: RES_SHIFT, top: 0 }}>
            <HudRealResources items={items} bar={RESOURCES_SLIM_BAR} asset={RES_SLIM_ASSET} compact centerContent />
          </div>
          {/* Mirrored cap on the left edge: ONE slice of the same bar
           *  (`resCapMirror` — the tail rect the Director picked in the
           *  cap-mirror lab) drawn horizontally flipped. Only `seatPx`
           *  shows — the ornament end — so the left seat equals the right
           *  cap's seat; the medallion is cut by the inner clip, not just
           *  covered. z-index 1 over the art, chips at 2 via scoped rule. */}
          <div
            aria-hidden
            data-testid="chrome-res-cap-mirror"
            style={{ position: 'absolute', left: 0, top: RES_CAP.destY, width: RES_CAP.seatPx, height: RES_CAP.h, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}
          >
            <img
              src={RES_SLIM_ASSET}
              alt=""
              draggable={false}
              style={{ position: 'absolute', left: RES_CAP.srcX + RES_CAP.w - RESOURCES_SLIM_BAR.w, top: -RES_CAP.srcY, width: RESOURCES_SLIM_BAR.w, height: RESOURCES_SLIM_BAR.h, maxWidth: 'none', transform: 'scaleX(-1)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
