/**
 * GameTopChrome — the slim docked top chrome of /game
 * (R-339 / PLAN-119 T6, artifact-r004 D3; D10 reserved the top-right zone,
 * which R-386 now assigns to the docked Events bar — no hanging tab).
 *
 * Three docked surfaces in blueprint mode: the day banner at its left dock,
 * the resource bar centred on `frame.W / 2`, and the Events bar inside the
 * top-right reserve. Time/resources share one `fit` — never past 1, down
 * only to keep banner/bar inside their bounds and, while viable, outside the
 * Events reserve. Events scales into the reserve itself; when the reserve
 * yields on narrow canvases it hides rather than overlapping the centred bar.
 *
 * Never an overlay: the chrome publishes its real occupancy into the shared
 * `useGameLayoutInsets` ledger (`top` = margin + row height × fit, 0 when
 * hidden). Bars render inside the HUD zoom layer; `--hud-text-k` keeps text
 * at its designed px, the same compensation the full bars get.
 */
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HudRealTimeConnected } from '@/ui/idleVillage/hudReal/HudRealTimeConnected';
import { HudRealResources } from '@/ui/idleVillage/hudReal/HudRealResources';
import { HudRealEventsBar } from '@/ui/idleVillage/hudReal/HudRealEventsBar';
import { HudRealEventsPanel } from '@/ui/idleVillage/hudReal/HudRealEventsPanel';
import { EVENTS_PANEL_CONFIG } from '@/balancing/config/idleVillage/eventsPanelConfig';
import { TIME_SLIM_BAR } from '@/ui/idleVillage/hudReal/timeSlimGeometry';
import { RESOURCES_SLIM_BAR } from '@/ui/idleVillage/hudReal/resourcesSlimGeometry';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import type { Frame } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';
import type { ResourceReadoutItem } from './ResourceReadout';
import type { HudEvent } from './HudEventLedger';

const TC = CASSETTO_LAYOUT_CONFIG.topChrome;
const RES_SLIM_ASSET = '/assets/ui/hud-real/resources/bar-slim.webp';
/* R-352: the resource bar renders at RES_K so its capsule (the plain band,
 *  ornaments ignored — `topChrome.capsulePx`, measured on the signed art)
 *  matches the banner's. R-376 (Director 2026-11-21): the regenerated
 *  pointed-cap art is natively specular end-to-end — the resCapMirror
 *  flipped-slice hack was retired with the medallion it was hiding.
 *  R-376-bis (Director 2026-11-21): `resourcesBoost` enlarges the bar in
 *  proportion to the banner (~420×68.6 — same width, the pair reads as
 *  siblings); chip text scales with it, never below designed px. */
const RES_K = (TC.capsulePx.time / TC.capsulePx.resources) * TC.resourcesBoost;
const RES_W = RESOURCES_SLIM_BAR.w * RES_K;
const RES_H = RESOURCES_SLIM_BAR.h * RES_K;
/* Events is the same Time shell object mirrored: its dimensions are Time's,
 *  not a parallel Events-art contract. */
const EVENTS_W = TIME_SLIM_BAR.w;
const EVENTS_H = TIME_SLIM_BAR.h;
const EVENTS_PANEL_SCALE = EVENTS_W / EVENTS_PANEL_CONFIG.art.w;
/** Row height = the tallest bar. */
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
  /** Live events shown by the docked Events bar (titles already translated). */
  events?: HudEvent[];
  /** Whether the Events panel is open. */
  eventsOpen?: boolean;
  /** Toggles the Events panel from the docked bar. */
  onToggleEvents?: () => void;
  /** Row selection inside the open Events panel (the host pans the camera). */
  onSelectEvent?: (event: HudEvent) => void;
}

export const GameTopChrome: React.FC<GameTopChromeProps> = ({ items, locked = false, visible = true, frame, events = [], eventsOpen = false, onToggleEvents, onSelectEvent }) => {
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
  /* R-386 (Director 2026-11-25): the top-right reserve is no longer empty —
   *  it docks the Events bar, specular to Time. While the reserve is wide
   *  enough to bind the chrome (`fitReserved >= minFitScale`) the bar fills
   *  it minus the symmetric right margin; when the reserve yields on narrow
   *  canvases the bar hides rather than overlapping the centred resources. */
  const eventsVisible = fitReserved >= TC.minFitScale;
  /* Director 2026-11-26: the Events right edge must sit at the same distance
   *  from the right window edge as the Time sun reads from the left — the
   *  banner's dock minus the sun medallion's visual overhang (scaled by fit). */
  const eventsRightMargin = Math.max(TC.marginPx, TC.bannerMarginPx - TC.sunTipOverhangPx * fit);
  const eventsWidth = Math.max(0, (TC.chronicleReservePx - eventsRightMargin) / scale);
  /* The Events shell is literally the Time shell mirrored: same geometry,
   *  same scale. Only reserve width can reduce it; there is no separate
   *  Events height ratio. */
  const eventsFit = eventsVisible ? Math.min(1, eventsWidth / EVENTS_W, fit) : 0;
  const eventsLeft = frame.W - eventsRightMargin - EVENTS_W * eventsFit;

  /* Honest occupancy (real px): top margin + the scaled row height. */
  const occupiedTop = visible ? (TC.marginPx + ROW_H * fit) * scale : 0;
  useEffect(() => {
    publish({ top: occupiedTop });
    return () => publish({ top: 0 });
  }, [occupiedTop, publish]);

  if (!visible) return null;

  /* One full-width band; each bar sits at its own left edge, vertically
   *  centred in the scaled row. */
  const barSlot = (w: number, h: number, slotLeft: number, slotScale = fit): React.CSSProperties => ({
    position: 'absolute', left: slotLeft, top: (ROW_H * fit - h * slotScale) / 2, width: w * slotScale, height: h * slotScale,
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
       *  (R-350), compact chips for the narrower slots; RES_K matches its
       *  capsule to the banner's and the pointed-cap art (R-376) is
       *  natively specular end-to-end — no cap mirror needed. */}
      <div data-hudslot="resources" data-testid="chrome-resources" style={{ ...barSlot(RES_W, RES_H, resLeft), pointerEvents: 'auto', ['--hud-text-k' as string]: String(fit > 0 ? 1 / (fit * Math.min(1, RES_K)) : 1) }}>
        <div style={barInner(RESOURCES_SLIM_BAR.w, RESOURCES_SLIM_BAR.h, RES_K)}>
          <HudRealResources items={items} bar={RESOURCES_SLIM_BAR} asset={RES_SLIM_ASSET} compact centerContent />
        </div>
      </div>
      {eventsVisible && (
        <div
          data-hudslot="events"
          data-testid="chrome-events"
          style={{
            ...barSlot(EVENTS_W, EVENTS_H, eventsLeft, eventsFit),
            pointerEvents: 'auto',
            ['--hud-text-k' as string]: String(eventsFit > 0 ? 1 / eventsFit : 1),
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, width: EVENTS_W, height: EVENTS_H, transform: `scale(${eventsFit})`, transformOrigin: 'top left' }}>
            <HudRealEventsBar events={events} open={eventsOpen} onToggle={onToggleEvents} />
            {/* R-386-open (Director 2026-11-26): the open panel hangs directly
             *  below the bar — the bar stays the visual header while "the part
             *  below" stretches downward into the signed sliced body; more
             *  events simply make it longer. Same scaled space as the bar, so
             *  alignment and zoom compensation come for free. */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: EVENTS_PANEL_CONFIG.behavior.dockTopPx,
                width: EVENTS_PANEL_CONFIG.art.w,
                transform: `scale(${EVENTS_PANEL_SCALE})`,
                transformOrigin: 'top left',
                ['--hud-text-k' as string]: String(eventsFit > 0 ? 1 / (eventsFit * EVENTS_PANEL_SCALE) : 1),
              }}
            >
              <HudRealEventsPanel events={events} open={eventsOpen} onSelect={onSelectEvent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
