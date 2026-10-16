/**
 * QuestCheckOptionsPanel — the per-check presentation popover of
 * `QuestRunWindow` (R-199 pt.9). A small `HudPlaque` that opens from the
 * header's `ico-spark` icon and decides how the docked astrolabe presents
 * each resolved check: full choreography, skip the opening reveal
 * (`throw()` — the ball still spins), or skip the whole cinematic (the
 * engine-resolved verdict still lands as a beat — the theatre is skipped,
 * never the outcome).
 *
 * Non-modal: a floating plaque, `Escape` or its close icon dismiss it and
 * return focus to the header toggle (WITNESS-04). Options are session
 * presentation state — React state on the window, never persisted.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';

/** The two presentation choices the panel governs. */
export interface QuestCheckOptions {
  /** Skip the astrolabe's opening reveal — the throw still plays. */
  skipIntro: boolean;
  /** Skip the whole astrolabe cinematic — the verdict still presents. */
  skipCheck: boolean;
}

export interface QuestCheckOptionsPanelProps {
  /** `id` the header toggle points at with `aria-controls`. */
  panelId: string;
  options: QuestCheckOptions;
  /** Config gates (`questWindow.skillCheck.allowSkip*`) — an option the
   *  config forbids renders disabled, not hidden. */
  allowSkipIntro: boolean;
  allowSkipCheck: boolean;
  onToggle: (key: keyof QuestCheckOptions) => void;
  onClose: () => void;
}

/** One toggle row: a bordered pill, `aria-pressed` carrying the state — the
 *  check square fills when on (icons keep HUD silence: no emoji). */
const OptionRow: React.FC<{
  label: string;
  pressed: boolean;
  disabled?: boolean;
  onToggle: () => void;
  testId: string;
}> = ({ label, pressed, disabled, onToggle, testId }) => (
  <button
    type="button"
    data-testid={testId}
    aria-pressed={pressed}
    disabled={disabled}
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '6px 8px',
      borderRadius: 6,
      border: `1px solid ${pressed ? 'var(--skin-title-color)' : 'color-mix(in srgb, var(--skin-surface-border) 60%, transparent)'}`,
      background: pressed ? 'color-mix(in srgb, var(--skin-title-color) 14%, transparent)' : 'transparent',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      textAlign: 'left',
    }}
  >
    <span
      aria-hidden
      style={{
        width: 12,
        height: 12,
        flexShrink: 0,
        borderRadius: 3,
        border: `1px solid ${pressed ? 'var(--skin-title-color)' : TONE.muted}`,
        background: pressed ? 'var(--skin-title-color)' : 'transparent',
      }}
    />
    <span style={{ fontFamily: 'var(--skin-font-serif)', fontSize: 13, lineHeight: 1.3, color: 'var(--skin-text-primary)' }}>
      {label}
    </span>
  </button>
);

export const QuestCheckOptionsPanel: React.FC<QuestCheckOptionsPanelProps> = ({
  panelId,
  options,
  allowSkipIntro,
  allowSkipCheck,
  onToggle,
  onClose,
}) => {
  const { t } = useTranslation('idleVillage');
  return (
    <HudPlaque
      shape="panel"
      as="aside"
      id={panelId}
      data-testid="quest-check-options"
      role="dialog"
      aria-label={t('gameFrame.questWindow.checkOptions')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px 12px', width: 240 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <EngravedIcon id="ico-spark" size={14} style={{ color: 'var(--skin-title-color)' }} />
        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--skin-font-display)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
          {t('gameFrame.questWindow.checkOptions')}
        </span>
        <span data-hud-controls="" style={{ display: 'inline-flex' }}>
          <button type="button" aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')} onClick={onClose}>
            <EngravedIcon id="cmd-close" />
          </button>
        </span>
      </div>
      <OptionRow
        testId="quest-check-opt-skip-intro"
        label={t('gameFrame.questWindow.checkOptionsSkipIntro')}
        pressed={options.skipIntro}
        disabled={!allowSkipIntro}
        onToggle={() => onToggle('skipIntro')}
      />
      <OptionRow
        testId="quest-check-opt-skip-check"
        label={t('gameFrame.questWindow.checkOptionsSkipCheck')}
        pressed={options.skipCheck}
        disabled={!allowSkipCheck}
        onToggle={() => onToggle('skipCheck')}
      />
    </HudPlaque>
  );
};

export default QuestCheckOptionsPanel;
