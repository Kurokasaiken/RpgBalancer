/**
 * ExpeditionDrawer — the docked right expedition surface of /game
 * (R-339 / PLAN-119 T2, mw-debate `20261115-wanderlust-ui-plan`
 * artifact-r004: the no-quest resting form is NOTHING — `ExpeditionEdgeTab`
 * was deleted (R-351, Director ruling 2026-11-15: the page mounts no
 * expedition surface without a quest).
 *
 * The surface is the signed `HudRealCassettoV2` column (docked flush right,
 * `aspect × viewportHeight` capped at `drawer.widthMaxPx`, publishing its
 * measured width to `useGameLayoutInsets.insets.right`).
 *
 * NO fold: the collapse chip on the column's left edge and the folded
 * right-edge chip are removed — Director ruling 2026-11-22 («c'è una
 * specie di freccia › — eliminala») sealing OB-7 γ «il cassetto resta
 * chiuso senza tab»: the cassetto is either open with a quest or absent;
 * closing is owned by the adapter (Esc / map click → `onClose`).
 *
 * T8 (mutual exclusion of the lateral surfaces, AC10): at or below
 * `bottomSheet.maxWidthPx` this component mounts `ExpeditionBottomSheet`
 * instead — the signed column never mounts in that band.
 */
import React from 'react';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import {
  HudRealCassettoV2,
  type HudRealCassettoV2Props,
} from '@/ui/idleVillage/hudReal/HudRealCassettoV2';
import { ExpeditionBottomSheet, useExpeditionSheetMode } from './ExpeditionBottomSheet';

const DRAWER = CASSETTO_LAYOUT_CONFIG.drawer;

/* R-357 (INV:cassetto-slide-lateral): the surface slides in from the right
 *  edge on `drawer.slideMs`; reduced-motion skips the keyframes entirely.
 *  (Slide-out belonged to the fold choreography — removed with the chip.) */
const SLIDE_CSS = `
@keyframes cassettoSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
`;
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: no-preference)';

export interface ExpeditionDrawerProps extends HudRealCassettoV2Props {
  /** Host visibility — hidden/unmounted publishes 0 and renders nothing. */
  visible?: boolean;
}

export const ExpeditionDrawer: React.FC<ExpeditionDrawerProps> = ({ visible = true, ...cassettoProps }) => {
  /* T8: in the ≤`bottomSheet.maxWidthPx` band the sheet is the only
   *  expedition form — the column never mounts. */
  const sheetMode = useExpeditionSheetMode();
  const canAnimate = window.matchMedia?.(REDUCED_MOTION_MQ).matches ?? false;

  if (!visible) return null;

  /* T8/AC10 mutual exclusion: the lateral drawer never mounts ≤1100 — the
   *  same props flow into the non-modal bottom sheet instead. */
  if (sheetMode) {
    return <ExpeditionBottomSheet {...cassettoProps} visible={visible} />;
  }

  return (
    <div
      data-testid="expedition-drawer"
      data-expanded=""
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <style>{SLIDE_CSS}</style>
      <div
        data-testid="expedition-drawer-slide"
        style={{
          position: 'absolute', inset: 0,
          animation: canAnimate ? `cassettoSlideIn ${DRAWER.slideMs}ms both` : undefined,
        }}
      >
        <HudRealCassettoV2 {...cassettoProps} />
      </div>
    </div>
  );
};

export default ExpeditionDrawer;
