import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
import { HudTooltip } from './HudTooltip';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { useLocalization } from '@/hooks/useLocalization';
import type { SupportedLocale } from '@/localization/LocaleConfig';
import { HUD_SCALE_MODES, type HudScaleControl } from './hudScale';
import { HUD_PANELS, HUD_PANEL_DEV_ONLY, HUD_PANEL_SHORTCUTS, isHudPanelListed, type HudPanelId } from './hudPanelRegistry';

export interface HudGameMenuProps {
  /** Panel visibility map shared with the bottom-right Panels menu. */
  visible: Record<HudPanelId, boolean>;
  onTogglePanel: (id: HudPanelId) => void;
  /** Manual save; may resolve `true` on success for the "saved" flash. Omitted = row disabled. */
  onSaveNow?: () => Promise<boolean> | boolean;
  /** Interface size (desktop app only); the row is omitted without it. */
  scale?: HudScaleControl;
  /** Open the Load game screen. Omitted = row disabled. */
  onLoadGame?: () => void;
  /** Open the full settings screen. Omitted = row disabled. */
  onOpenSettings?: () => void;
  /** Leave to the title screen. Omitted = row disabled. */
  onQuit?: () => void;
  /** Offer the dev-only panels (Director, Tuning). Off in a production build. */
  includeDev?: boolean;
}

const SECTION_LABEL_STYLE = {
  font: '600 12px var(--skin-font-display)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--skin-label-primary)',
} as const;

/** Locales offered in the menu's language switch (R-138). */
const MENU_LOCALES: readonly SupportedLocale[] = ['en', 'it-IT'];

/**
 * Game menu — an icon in the bottom-right corner cluster (HUD-3 = P1; Esc opens it too). It opens a dropdown with the real controls that exist
 * today (panel toggles, manual save, language and skin choice) plus the disabled
 * entries (Load, Settings, Quit) that open their screens (PLAN-076).
 */
export function HudGameMenu({ visible, onTogglePanel, onSaveNow, scale, onLoadGame, onOpenSettings, onQuit, includeDev = false }: HudGameMenuProps) {
  const { t } = useTranslation('idleVillage');
  const { locale, setLocale } = useLocalization();
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
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  /* HUD-3 = P1 (R-234): Esc opens and closes the menu. It only opens when nothing else claims the key —
   * a handler that already consumed it, a text field, or an open dialog keep Esc for themselves. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (open) { setOpen(false); return; }
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      trackTelemetryEvent('game_menu_toggle', { open: true, via: 'escape' });
      setOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const panelIds = HUD_PANELS.map((p) => p.id as HudPanelId).filter((id) => isHudPanelListed(id) && (includeDev || !HUD_PANEL_DEV_ONLY.has(id)));

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

  /** A screen-opening entry: closes the menu, then hands over to its screen. Without a handler it stays disabled. */
  const entryProps = (handler: (() => void) | undefined) =>
    handler
      ? ({ onClick: () => { setOpen(false); handler(); }, style: { width: '100%' } } as const)
      : ({ disabled: true, title: t('gameFrame.menu.comingSoon'), style: { width: '100%', opacity: 0.45 } } as const);

  return (
    <div ref={root} data-hud-controls="" style={{ position: 'relative', pointerEvents: 'auto' }}>
      <HudTooltip label={t('gameFrame.menu.title')} shortcut="Esc" side="top">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t('gameFrame.menu.title')}
          data-testid="hud-menu-trigger"
          onClick={toggleMenu}
          style={{ width: 40, height: 40 }}
        >
          <EngravedIcon id="cmd-menu" />
        </button>
      </HudTooltip>

      {open && (
        <HudPlaque
          shape="panel"
          as="div"
          role="menu"
          aria-label={t('gameFrame.menu.title')}
          style={{ position: 'absolute', bottom: 'calc(100% + 10px)', right: 0, zIndex: 1100, display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', minWidth: 230 }}
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
          <button type="button" role="menuitem" {...entryProps(onLoadGame)}>
            <span>{t('gameFrame.menu.loadGame')}</span>
          </button>
          <button type="button" role="menuitem" {...entryProps(onQuit)}>
            <span>{t('gameFrame.menu.quit')}</span>
          </button>

          <div aria-hidden="true" style={{ height: 1, margin: '4px 0', background: 'var(--skin-surface-border)' }} />
          <span style={SECTION_LABEL_STYLE}>{t('gameFrame.menu.options')}</span>
          <span style={SECTION_LABEL_STYLE}>{t('gameFrame.menu.language')}</span>
          <div role="radiogroup" aria-label={t('gameFrame.menu.language')} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {MENU_LOCALES.map((id) => (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={locale === id}
                aria-pressed={locale === id}
                onClick={() => {
                  setLocale(id);
                  trackTelemetryEvent('game_menu_language_select', { locale: id });
                }}
              >
                <span>{t(`gameFrame.menu.languages.${id}`)}</span>
              </button>
            ))}
          </div>
          {scale && (
            <>
              <span style={SECTION_LABEL_STYLE}>{t('gameFrame.menu.interfaceSize')}</span>
              <div role="radiogroup" aria-label={t('gameFrame.menu.interfaceSize')} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {HUD_SCALE_MODES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={scale.mode === id}
                    aria-pressed={scale.mode === id}
                    title={id === 'auto' ? t('gameFrame.menu.interfaceSizeAutoHint', { percent: Math.round(scale.effective * 100) }) : undefined}
                    onClick={() => {
                      scale.onChange(id);
                      trackTelemetryEvent('game_menu_scale_select', { scale: id });
                    }}
                  >
                    <span>{id === 'auto' ? t('gameFrame.menu.interfaceSizeAuto') : `${Math.round(id * 100)}%`}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <button type="button" role="menuitem" {...entryProps(onOpenSettings)}>
            <span>{t('gameFrame.menu.settings')}</span>
          </button>
        </HudPlaque>
      )}
    </div>
  );
}

export default HudGameMenu;
