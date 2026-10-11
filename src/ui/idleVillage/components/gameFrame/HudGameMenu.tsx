import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { COMPARABLE_SKIN_IDS } from '@/ui/idleVillage/skins/resolveInitialSkin';
import { getSkinPresetConfig, type SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';
import { HUD_PANELS, HUD_PANEL_DEV_ONLY, HUD_PANEL_SHORTCUTS, type HudPanelId } from './hudPanelRegistry';

/** Live skin switch surfaced inside the menu (the page owns the preset state). */
export interface HudSkinControl {
  id: SkinPresetId;
  onChange: (id: SkinPresetId) => void;
}

export interface HudGameMenuProps {
  /** Panel visibility map shared with the bottom-right Panels menu. */
  visible: Record<HudPanelId, boolean>;
  onTogglePanel: (id: HudPanelId) => void;
  /** Manual save; may resolve `true` on success for the "saved" flash. Omitted = row disabled. */
  onSaveNow?: () => Promise<boolean> | boolean;
  /** Live skin selector; the Options section is omitted without it. */
  skin?: HudSkinControl;
  /** Offer the dev-only panels (Director, Tuning). Off in a production build. */
  includeDev?: boolean;
}

const SECTION_LABEL_STYLE = {
  font: '600 12px var(--skin-font-display)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--skin-label-primary)',
} as const;

/**
 * Game menu — the top-left cartouche (R-132). A `hang` plaque like the other two
 * top ribbons; its Menu button opens a dropdown with the real controls that exist
 * today (panel toggles, manual save, skin choice) plus the disabled entries
 * (Load, Options, Quit) reserved for their future screens.
 */
export function HudGameMenu({ visible, onTogglePanel, onSaveNow, skin, includeDev = false }: HudGameMenuProps) {
  const { t } = useTranslation('idleVillage');
  const [open, setOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const root = useRef<HTMLDivElement>(null);
  const savedTimer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

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

  const panelIds = HUD_PANELS.map((p) => p.id as HudPanelId).filter((id) => includeDev || !HUD_PANEL_DEV_ONLY.has(id));

  const toggleMenu = () => {
    setOpen((v) => {
      trackTelemetryEvent('game_menu_toggle', { open: !v });
      return !v;
    });
  };

  const handleSaveNow = async () => {
    if (!onSaveNow || saveState === 'saving') return;
    setSaveState('saving');
    const ok = await onSaveNow();
    trackTelemetryEvent('game_menu_save_now', { success: ok });
    setSaveState(ok ? 'saved' : 'idle');
    if (ok) {
      savedTimer.current = window.setTimeout(() => setSaveState('idle'), 1600);
    }
  };

  const stubProps = { disabled: true, title: t('gameFrame.menu.comingSoon'), style: { width: '100%', opacity: 0.45 } } as const;

  return (
    <div ref={root} style={{ position: 'relative', pointerEvents: 'auto' }}>
      <HudPlaque
        shape="hang"
        as="section"
        aria-label={t('gameFrame.menu.title')}
        style={{ display: 'flex', alignItems: 'center', padding: '13px 16px 11px' }}
      >
        <div data-hud-controls="">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={toggleMenu}
          >
            <Menu size={14} />
            <span>{t('gameFrame.menu.title')}</span>
          </button>
        </div>
      </HudPlaque>

      {open && (
        <HudPlaque
          shape="panel"
          as="div"
          role="menu"
          aria-label={t('gameFrame.menu.title')}
          style={{ position: 'absolute', top: 'calc(100% - 8px)', left: 0, zIndex: 1100, display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', minWidth: 230 }}
        >
          <span style={SECTION_LABEL_STYLE}>{t('gameFrame.panels.title')}</span>
          {panelIds.map((id) => (
            <button
              key={id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={visible[id]}
              aria-pressed={visible[id]}
              onClick={() => {
                onTogglePanel(id);
                trackTelemetryEvent('game_menu_panel_toggle', { panelId: id, visible: !visible[id] });
              }}
              style={{ justifyContent: 'space-between', width: '100%', whiteSpace: 'nowrap', gap: 16 }}
            >
              <span>{t(`gameFrame.panels.names.${id}`)}</span>
              <span aria-hidden="true" style={{ opacity: 0.75 }}>{HUD_PANEL_SHORTCUTS[id].toUpperCase()}</span>
            </button>
          ))}

          <div aria-hidden="true" style={{ height: 1, margin: '4px 0', background: 'var(--skin-surface-border)' }} />
          <span style={SECTION_LABEL_STYLE}>{t('gameFrame.menu.session')}</span>
          <button
            type="button"
            role="menuitem"
            disabled={!onSaveNow || saveState === 'saving'}
            onClick={() => void handleSaveNow()}
            style={{ width: '100%' }}
          >
            <span>{saveState === 'saved' ? t('gameFrame.menu.saved') : saveState === 'saving' ? t('gameFrame.menu.saving') : t('gameFrame.menu.saveNow')}</span>
          </button>
          <button type="button" role="menuitem" {...stubProps}>
            <span>{t('gameFrame.menu.loadGame')}</span>
          </button>
          <button type="button" role="menuitem" {...stubProps}>
            <span>{t('gameFrame.menu.quit')}</span>
          </button>

          <div aria-hidden="true" style={{ height: 1, margin: '4px 0', background: 'var(--skin-surface-border)' }} />
          <span style={SECTION_LABEL_STYLE}>{t('gameFrame.menu.options')}</span>
          {skin && (
            <div role="radiogroup" aria-label={t('gameFrame.menu.theme')} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {COMPARABLE_SKIN_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={skin.id === id}
                  aria-pressed={skin.id === id}
                  onClick={() => {
                    skin.onChange(id);
                    trackTelemetryEvent('game_menu_skin_select', { skinId: id });
                  }}
                >
                  <span>{getSkinPresetConfig(id).label}</span>
                </button>
              ))}
            </div>
          )}
          <button type="button" role="menuitem" {...stubProps}>
            <span>{t('gameFrame.menu.settings')}</span>
          </button>
        </HudPlaque>
      )}
    </div>
  );
}

export default HudGameMenu;
