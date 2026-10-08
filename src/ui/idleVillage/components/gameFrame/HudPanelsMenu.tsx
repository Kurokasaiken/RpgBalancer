import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutPanelLeft } from 'lucide-react';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { HUD_PANELS, HUD_PANEL_DEV_ONLY, HUD_PANEL_SHORTCUTS, type HudPanelId } from './hudPanelRegistry';

export interface HudPanelsMenuProps {
  visible: Record<HudPanelId, boolean>;
  onToggle: (id: HudPanelId) => void;
  /** Offer the dev-only instruments (Director, Tuning). Off in a production build. */
  includeDev?: boolean;
}

/**
 * "Panels" menu: the way back for every floating panel that can be closed. A button in
 * the bottom-right corner opens a short list; each row shows its shortcut and state.
 */
export function HudPanelsMenu({ visible, onToggle, includeDev = false }: HudPanelsMenuProps) {
  const { t } = useTranslation('idleVillage');
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const ids = HUD_PANELS.map((p) => p.id as HudPanelId).filter((id) => includeDev || !HUD_PANEL_DEV_ONLY.has(id));
  const hiddenCount = ids.filter((id) => !visible[id]).length;
  return (
    <div ref={root} data-hud-controls="" style={{ position: 'relative', pointerEvents: 'auto' }}>
      {open && (
        <HudPlaque
          shape="panel"
          as="div"
          role="menu"
          aria-label={t('gameFrame.panels.title')}
          style={{ position: 'absolute', right: 0, bottom: 'calc(100% + 10px)', zIndex: 1100, display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', minWidth: 240 }}
        >
          <span style={{ font: '600 12px var(--skin-font-display)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--skin-label-primary)' }}>
            {t('gameFrame.panels.title')}
          </span>
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={visible[id]}
              aria-pressed={visible[id]}
              onClick={() => onToggle(id)}
              style={{ justifyContent: 'space-between', width: '100%', whiteSpace: 'nowrap', gap: 16 }}
            >
              <span>{t(`gameFrame.panels.names.${id}`)}</span>
              <span aria-hidden="true" style={{ opacity: 0.75 }}>{HUD_PANEL_SHORTCUTS[id].toUpperCase()}</span>
            </button>
          ))}
        </HudPlaque>
      )}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('gameFrame.panels.title')}
        title={t('gameFrame.panels.title')}
        onClick={() => setOpen((v) => !v)}
        style={{ width: 40, height: 40, position: 'relative' }}
      >
        <LayoutPanelLeft />
        {hiddenCount > 0 && (
          <span aria-hidden="true" data-badge="" style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, font: '700 12px/16px var(--skin-font-display)', textAlign: 'center', background: 'var(--skin-label-primary)', color: 'var(--skin-surface-base)' }}>
            {hiddenCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default HudPanelsMenu;
