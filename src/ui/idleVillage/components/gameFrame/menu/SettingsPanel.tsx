/**
 * SettingsPanel — «Impostazioni» (PLAN-076 T-4, SET-1 A): one plaque, sections
 * in a column. Every row is a real setting that acts immediately: language,
 * audio levels, interface size (desktop app only), reduced motion. The music
 * level exists in the model but has no source in /game yet, so it has no row.
 */
import { useSyncExternalStore, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { GameMenuDialog } from './GameMenuDialog';
import { MENU_LOCALES } from './menuFlow';
import { useLocalization } from '@/hooks/useLocalization';
import { HUD_SCALE_MODES, type HudScaleControl } from '../hudScale';
import { getGameSettings, resetGameSettings, setGameSettings, subscribeGameSettings } from '../../../state/gameSettings';

export interface SettingsPanelProps {
  onClose: () => void;
  /** Interface size control (desktop app only); the row is omitted without it. */
  scale?: HudScaleControl;
}

const SECTION: CSSProperties = { font: '600 12px var(--skin-font-display)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--skin-label-primary)', margin: '10px 0 2px' };
const ROW: CSSProperties = { display: 'grid', gridTemplateColumns: '190px 1fr', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid color-mix(in srgb, var(--skin-surface-border) 50%, transparent)' };
const LABEL: CSSProperties = { color: 'var(--skin-text-primary)', font: '500 15px var(--skin-font-serif)' };
const MUTED: CSSProperties = { color: 'var(--skin-text-secondary)', font: '400 13.5px var(--skin-font-serif)' };

function LevelRow({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) {
  return (
    <label style={ROW}>
      <span style={LABEL}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(value * 100)}
          aria-label={label}
          onChange={(event) => onChange(Number(event.target.value) / 100)}
          style={{ flex: 1, accentColor: 'var(--skin-title-color)' }}
        />
        <span aria-hidden="true" style={{ ...LABEL, width: 44, textAlign: 'right' }}>{Math.round(value * 100)}</span>
      </span>
    </label>
  );
}

export function SettingsPanel({ onClose, scale }: SettingsPanelProps) {
  const { t } = useTranslation('idleVillage');
  const { locale, setLocale } = useLocalization();
  const settings = useSyncExternalStore(subscribeGameSettings, getGameSettings);

  return (
    <GameMenuDialog title={t('gameFrame.menu.settingsPanel.title')} onClose={onClose} width={640} data-testid="settings-panel">
      <div style={{ overflowY: 'auto' }}>
        <div style={SECTION}>{t('gameFrame.menu.settingsPanel.general')}</div>
        <div style={ROW}>
          <span style={LABEL}>{t('gameFrame.menu.language')}</span>
          <span data-hud-controls="" role="radiogroup" aria-label={t('gameFrame.menu.language')} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MENU_LOCALES.map((id) => (
              <button key={id} type="button" role="radio" aria-checked={locale === id} aria-pressed={locale === id} onClick={() => setLocale(id)}>
                <span>{t(`gameFrame.menu.languages.${id}`)}</span>
              </button>
            ))}
          </span>
        </div>

        <div style={SECTION}>{t('gameFrame.menu.settingsPanel.audio')}</div>
        <LevelRow label={t('gameFrame.menu.settingsPanel.master')} value={settings.master} onChange={(master) => setGameSettings({ master })} />
        <LevelRow label={t('gameFrame.menu.settingsPanel.effects')} value={settings.effects} onChange={(effects) => setGameSettings({ effects })} />

        <div style={SECTION}>{t('gameFrame.menu.settingsPanel.interface')}</div>
        {scale && (
          <div style={ROW}>
            <span style={LABEL}>{t('gameFrame.menu.interfaceSize')}</span>
            <span data-hud-controls="" role="radiogroup" aria-label={t('gameFrame.menu.interfaceSize')} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {HUD_SCALE_MODES.map((id) => (
                <button key={id} type="button" role="radio" aria-checked={scale.mode === id} aria-pressed={scale.mode === id} onClick={() => scale.onChange(id)}>
                  <span>{id === 'auto' ? t('gameFrame.menu.interfaceSizeAuto') : `${Math.round(id * 100)}%`}</span>
                </button>
              ))}
            </span>
          </div>
        )}
        <div style={ROW}>
          <span style={LABEL}>{t('gameFrame.menu.settingsPanel.reducedMotion')}</span>
          <span data-hud-controls="" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" role="switch" aria-checked={settings.reducedMotion} aria-pressed={settings.reducedMotion} aria-label={t('gameFrame.menu.settingsPanel.reducedMotion')} onClick={() => setGameSettings({ reducedMotion: !settings.reducedMotion })}>
              <span>{settings.reducedMotion ? 'On' : 'Off'}</span>
            </button>
            <span style={MUTED}>{t('gameFrame.menu.settingsPanel.reducedMotionHint')}</span>
          </span>
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 1, background: 'var(--skin-surface-border)', flexShrink: 0 }} />
      <div data-hud-controls="" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ ...MUTED, flex: 1 }}>{t('gameFrame.menu.settingsPanel.appliesNow')}</span>
        <button type="button" onClick={() => resetGameSettings(undefined, true)}>
          <span>{t('gameFrame.menu.settingsPanel.reset')}</span>
        </button>
      </div>
    </GameMenuDialog>
  );
}

export default SettingsPanel;
