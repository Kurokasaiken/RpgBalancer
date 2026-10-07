import React from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { useHudPanelDrag } from './useHudPanelDrag';

export interface DirectorAction {
  id: string;
  label: string;
  /** Shown as pressed while the scripted thing is on screen. */
  active?: boolean;
  onTrigger: () => void;
}

export interface DirectorPanelProps {
  actions: DirectorAction[];
  onReset?: () => void;
}

/**
 * Director panel — a test / trailer instrument, not product UI: the page mounts it
 * in dev builds only. Its own chrome is translated; the action labels arrive
 * already translated from the caller. Each button fires one scripted beat on the
 * live screen — an invasion announcement, a quest appearing on the map — so a
 * take can be staged on demand. It is draggable by its handle like every HUD
 * panel and collapses to its title bar.
 */
export const DirectorPanel: React.FC<DirectorPanelProps> = ({ actions, onReset }) => {
  const { t } = useTranslation('idleVillage');
  const { panelStyle, handleProps } = useHudPanelDrag();
  const [open, setOpen] = React.useState(true);
  return (
    <HudPlaque
      shape="panel"
      as="section"
      aria-label={t('gameFrame.director.title')}
      data-testid="director-panel"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 100,
        zIndex: 1000,
        width: 188,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '9px 12px 10px',
        pointerEvents: 'auto',
        ...panelStyle,
      }}
    >
      <div {...handleProps} title={t('gameFrame.panel.dragHint')} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontFamily: 'var(--wl-font-display, "Cinzel", serif)', fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--skin-title-color, #f0cf6a)' }}>
          {t('gameFrame.director.title')}
        </span>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--skin-label-primary, #c9a84e)', cursor: 'pointer', fontSize: 11 }}
        >
          {open ? '–' : '+'}
        </button>
      </div>
      {open &&
        actions.map((action) => (
          <button
            key={action.id}
            type="button"
            aria-pressed={action.active}
            onClick={action.onTrigger}
            style={{
              padding: '5px 8px',
              borderRadius: 8,
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--wl-font-sans, system-ui, sans-serif)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: action.active ? 'var(--skin-title-color, #f0cf6a)' : 'var(--skin-label-primary, #c9a84e)',
              background: action.active ? 'rgba(223,184,87,0.16)' : 'rgba(216,177,62,0.05)',
              border: `1px solid ${action.active ? 'rgba(223,184,87,0.5)' : 'rgba(223,184,87,0.16)'}`,
            }}
          >
            {action.label}
          </button>
        ))}
      {open && onReset && (
        <button
          type="button"
          onClick={onReset}
          style={{ background: 'none', border: 'none', padding: '2px 0 0', textAlign: 'left', cursor: 'pointer', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--skin-label-tertiary, #9a8246)' }}
        >
          {t('gameFrame.director.reset')}
        </button>
      )}
    </HudPlaque>
  );
};

export default DirectorPanel;
