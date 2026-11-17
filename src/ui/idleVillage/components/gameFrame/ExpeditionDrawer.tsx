/**
 * ExpeditionDrawer — the docked right expedition surface of /game
 * (R-339 / PLAN-119 T2, mw-debate `20261115-wanderlust-ui-plan`
 * artifact-r004: drawer docked flush-right, collapse chip as its only
 * folded form while a quest is selected; the no-quest resting form is
 * NOTHING — `ExpeditionEdgeTab` was deleted (R-351, Director ruling
 * 2026-11-15: the page mounts no expedition surface without a quest).
 *
 * Expanded, the surface is the signed `HudRealCassetto` column (docked
 * flush right, `aspect × viewportHeight` capped at `drawer.widthMaxPx`,
 * publishing its measured width to `useGameLayoutInsets.insets.right`).
 * Collapsed, it rests as a slim chip docked on the right edge that
 * publishes `drawer.chipWidthPx` — the fold is visual only: the planner
 * detail stays open, so slots/bag/session survive intact across it
 * (mirrors the rail's collapse chip contract, T5/D2).
 *
 * The fold state lives in `useExpeditionDrawer` (Zustand): the drawer
 * mounts deep inside the session's `wrapDetail`, and sibling surfaces —
 * the T8 sheet — may need to read or steer the fold from outside.
 *
 * T8 (mutual exclusion of the lateral surfaces, AC10): at or below
 * `bottomSheet.maxWidthPx` this component mounts `ExpeditionBottomSheet`
 * instead — the signed column and BOTH chips never mount in that band.
 */
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { useExpeditionDrawer } from '@/ui/idleVillage/store/useExpeditionDrawer';
import {
  HudRealCassetto,
  useCassettoColumnSpec,
  type HudRealCassettoProps,
} from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { EngravedIcon } from './engravedIcons';
import { ExpeditionBottomSheet, useExpeditionSheetMode } from './ExpeditionBottomSheet';

const DRAWER = CASSETTO_LAYOUT_CONFIG.drawer;

export interface ExpeditionDrawerProps extends HudRealCassettoProps {
  /** Host visibility — hidden/unmounted publishes 0 and renders nothing. */
  visible?: boolean;
}

export const ExpeditionDrawer: React.FC<ExpeditionDrawerProps> = ({ visible = true, ...cassettoProps }) => {
  const { t } = useTranslation('idleVillage');
  const expanded = useExpeditionDrawer((s) => s.expanded);
  const setExpanded = useExpeditionDrawer((s) => s.setExpanded);
  const publish = useGameLayoutInsets((s) => s.publish);
  const spec = useCassettoColumnSpec();
  /* T8: in the ≤`bottomSheet.maxWidthPx` band the sheet is the only
   *  expedition form — the column and both chips never mount. */
  const sheetMode = useExpeditionSheetMode();

  /* Honest occupancy while folded: the chip publishes `chipWidthPx`. While
   *  expanded `insets.right` is owned by the column itself (its own effect,
   *  hud-real-cassetto.INV-4) — this effect must NOT publish in that mode or
   *  it would clobber the child's measure on the same commit. In the sheet
   *  band `insets.right` stays 0 (the lateral surface does not exist). */
  useEffect(() => {
    if (!visible || expanded || sheetMode) return;
    publish({ right: DRAWER.chipWidthPx });
    return () => publish({ right: 0 });
  }, [visible, expanded, sheetMode, publish]);

  if (!visible) return null;

  /* T8/AC10 mutual exclusion: the lateral drawer never mounts ≤1100 — the
   *  same props flow into the non-modal bottom sheet instead. */
  if (sheetMode) {
    return <ExpeditionBottomSheet {...cassettoProps} visible={visible} />;
  }

  /* The fold chip hugs the column's live left edge: right offset =
   *  `min(aspect × 100vh, widthMaxPx)` — the same width rule the column
   *  applies (`cassettoColumnWidthFor`), expressed in CSS so no second
   *  measure/resize listener is needed. */
  const columnLeftEdge = `min(${spec.aspect} * 100vh, ${DRAWER.widthMaxPx}px)`;

  return (
    <div
      data-testid="expedition-drawer"
      data-expanded={expanded || undefined}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {expanded ? (
        <>
          <HudRealCassetto {...cassettoProps} />
          {/* Fold chip — the only collapsed affordance (mirrors the rail's
           *  collapse chip): a mini-plaque on the column's left edge whose
           *  chevron points at the edge the surface folds onto. */}
          <button
            type="button"
            data-testid="expedition-drawer-collapse"
            aria-label={t('gameFrame.cassetto.collapse')}
            onClick={() => setExpanded(false)}
            style={{
              position: 'absolute',
              right: columnLeftEdge,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 26,
              height: 56,
              display: 'grid',
              placeItems: 'center',
              border: '1px solid color-mix(in srgb, var(--skin-frame-brass) 55%, transparent)',
              borderRight: 'none',
              borderRadius: '10px 0 0 10px',
              background: 'var(--skin-raised-bg)',
              color: 'var(--skin-text-secondary)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: 5,
            }}
          >
            <EngravedIcon id="cmd-chevron-right" size={12} aria-hidden />
          </button>
        </>
      ) : (
        /* Folded form — a slim chip docked flush on the right edge (mirrors
         *  `rail-expand-chip`): pouch glyph for "the planner is in here" +
         *  a chevron pointing into the free map. Not a modal, never blocks
         *  map input outside its own box. */
        <button
          type="button"
          data-testid="expedition-drawer-expand"
          aria-label={t('gameFrame.cassetto.expand')}
          onClick={() => setExpanded(true)}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: DRAWER.chipWidthPx,
            height: 72,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            border: '1px solid color-mix(in srgb, var(--skin-frame-brass) 55%, transparent)',
            borderRight: 'none',
            borderRadius: '10px 0 0 10px',
            background: 'var(--skin-raised-bg)',
            color: 'var(--skin-title-color)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.floating,
          }}
        >
          <EngravedIcon id="ico-pouch" size={16} aria-hidden />
          <EngravedIcon id="cmd-chevron-left" size={12} aria-hidden style={{ opacity: 0.7 }} />
        </button>
      )}
    </div>
  );
};

export default ExpeditionDrawer;
