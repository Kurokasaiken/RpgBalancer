/**
 * GameTopChrome — the slim docked top chrome of /game
 * (R-339 / PLAN-119 T6, mw-debate `20261115-wanderlust-ui-plan`
 * artifact-r004: D3 two separate slimmer elements shifted LEFT, Director
 * ruling D10 2026-11-15 — the top-right zone is RESERVED for the future
 * docked Chronicle surface; no hanging tab).
 *
 * One cluster of the signed slim bars (generated `bar-slim.webp` art,
 * PLAN-112 F4): the day banner (phase sun/moon dial seated in the emerald
 * via `timeOfDay.dialSlim`) + the resource bar, arranged left/center — its
 * left edge hugs the free-map band one `topChrome.marginPx` right of the
 * rail's published `insets.left`, so collapsing the left column slides the
 * chrome with it. Never an overlay: it publishes its real occupancy into
 * the shared `useGameLayoutInsets` ledger (`top` = margin + row height ×
 * fit, 0 when hidden) so the free-rect math always subtracts it.
 *
 * The Chronicle reserve (`topChrome.chronicleReservePx`, real px) is a soft
 * bound: while the cluster can stay at or above `topChrome.minFitScale` its
 * right edge never crosses `frame.W - reserve`; below that the reserve
 * yields — the only hard bound is the window edge, the chrome never
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
/** Natural cluster width in design px (banner + gap + resource bar). */
const NAT_W = TIME_SLIM_BAR.w + TC.gapPx + RESOURCES_SLIM_BAR.w;
/** Row height = the tallest slim bar (the resources' pendant dips lowest). */
const ROW_H = Math.max(TIME_SLIM_BAR.h, RESOURCES_SLIM_BAR.h);

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

  /* Left edge: one margin right of whatever the left side publishes
   *  (rail expanded / collapse chip / nothing) — insets are real px, the
   *  frame works in design px. */
  const left = leftInset / scale + TC.marginPx;
  /* Fit: natural size while it clears the Chronicle reserve; if that would
   *  force the cluster below `minFitScale` the reserve yields and the
   *  cluster shrinks only as far as the window edge requires. */
  const reserveLimit = frame.W - TC.chronicleReservePx / scale;
  const screenLimit = frame.W - TC.marginPx;
  const fitReserved = Math.min(1, (reserveLimit - left) / NAT_W);
  const fit =
    fitReserved >= TC.minFitScale
      ? fitReserved
      : Math.max(0, Math.min(1, (screenLimit - left) / NAT_W));

  /* Honest occupancy (real px): top margin + the scaled row height. */
  const occupiedTop = visible ? (TC.marginPx + ROW_H * fit) * scale : 0;
  useEffect(() => {
    publish({ top: occupiedTop });
    return () => publish({ top: 0 });
  }, [occupiedTop, publish]);

  if (!visible) return null;

  const barSlot = (w: number, h: number): React.CSSProperties => ({ position: 'relative', width: w * fit, height: h * fit, flexShrink: 0 });
  const barInner = (w: number, h: number): React.CSSProperties => ({ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${fit})`, transformOrigin: 'top left' });

  return (
    <div
      data-testid="game-top-chrome"
      role="group"
      aria-label={t('gameFrame.topChrome.ariaLabel')}
      style={{
        position: 'absolute',
        left,
        top: TC.marginPx,
        display: 'flex',
        alignItems: 'center',
        gap: TC.gapPx,
        height: ROW_H * fit,
        zIndex: 5,
        pointerEvents: 'none',
        ['--hud-text-k' as string]: String(fit > 0 ? 1 / fit : 1),
      }}
    >
      {/* Day banner — slim bar, phase sun/moon dial seated in the emerald
       *  (the mockup's sun ornament, config-driven via `timeOfDay.dialSlim`). */}
      <div data-hudslot="time" data-testid="chrome-day-banner" style={{ ...barSlot(TIME_SLIM_BAR.w, TIME_SLIM_BAR.h), pointerEvents: 'auto' }}>
        <div style={barInner(TIME_SLIM_BAR.w, TIME_SLIM_BAR.h)}>
          <HudRealTimeConnected locked={locked} slim />
        </div>
      </div>
      {/* Resource bar — slim bar, compact chips for the narrower slots. */}
      <div data-hudslot="resources" data-testid="chrome-resources" style={{ ...barSlot(RESOURCES_SLIM_BAR.w, RESOURCES_SLIM_BAR.h), pointerEvents: 'auto' }}>
        <div style={barInner(RESOURCES_SLIM_BAR.w, RESOURCES_SLIM_BAR.h)}>
          <HudRealResources items={items} bar={RESOURCES_SLIM_BAR} asset={RES_SLIM_ASSET} compact />
        </div>
      </div>
    </div>
  );
};
