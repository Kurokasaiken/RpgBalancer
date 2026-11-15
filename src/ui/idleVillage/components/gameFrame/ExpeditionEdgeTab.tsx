/**
 * ExpeditionEdgeTab — the no-quest resting state of the expedition surface
 * (R-339 / PLAN-119, D6 mode (b), mw-debate artifact-r004).
 *
 * When no quest marker is selected the planner does not open a panel at all;
 * what remains is a slim tab docked flush on the right edge telling the player
 * the mechanism (pick a quest marker on the map). The full drawer replaces it
 * automatically the moment a marker is chosen — the tab never acts as a modal,
 * never swallows map input outside its own box.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { EngravedIcon } from './engravedIcons';

export interface ExpeditionEdgeTabProps {
  /** Host decides visibility (e.g. `view === 'map' && !detailOpen && !hudHidden`). */
  visible: boolean;
}

export const ExpeditionEdgeTab: React.FC<ExpeditionEdgeTabProps> = ({ visible }) => {
  const { t } = useTranslation('idleVillage');
  if (!visible) return null;
  return (
    <div
      data-testid="expedition-edge-tab"
      style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 5,
        pointerEvents: 'auto',
      }}
    >
      <HudPlaque
        shape="hang"
        as="div"
        role="status"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '14px 10px',
          borderRadius: '12px 0 0 12px',
          borderRight: 'none',
        }}
      >
        <EngravedIcon id="ico-pouch" size={20} style={{ color: 'var(--skin-title-color)' }} aria-hidden />
        <span
          style={{
            writingMode: 'vertical-rl',
            fontFamily: 'var(--skin-font-display)',
            fontSize: 'var(--skin-hud-caps-size)',
            fontWeight: 'var(--skin-hud-caps-weight)' as React.CSSProperties['fontWeight'],
            letterSpacing: 'var(--skin-hud-caps-tracking)',
            textTransform: 'uppercase',
            color: 'var(--skin-text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('gameFrame.cassetto.edgeTab.hint')}
        </span>
      </HudPlaque>
    </div>
  );
};

export default ExpeditionEdgeTab;
