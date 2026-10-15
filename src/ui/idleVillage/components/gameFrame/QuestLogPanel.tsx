/**
 * QuestLogPanel — the run's chronicle, as a companion plaque of the
 * `QuestRunWindow` shell (R-196 / PLAN-035). Mounts at the window's RIGHT
 * inside `[data-hud-companion="right"]` with the parchment glyph
 * (`ico-scroll`) in its header and in the header toggle that opens it.
 *
 * The plaque is bounded by the shell's height (`top:0;bottom:0` on the
 * column); the scroll lives on the inner `<ul>` only — never on the
 * `HudPlaque`, whose overflow would clip its own drop-shadow.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { LOG_TONE, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';

export interface QuestLogPanelProps {
  /** `id` the header toggle points at with `aria-controls`. */
  panelId: string;
  run: QuestRunState;
  onClose: () => void;
}

export const QuestLogPanel: React.FC<QuestLogPanelProps> = ({ panelId, run, onClose }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <HudPlaque
      shape="panel"
      as="aside"
      id={panelId}
      data-testid="quest-log-panel"
      aria-label={t('gameFrame.questWindow.chronicle')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px 12px', minHeight: 0, flex: '1 1 auto', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <EngravedIcon id="ico-scroll" size={14} style={{ color: 'var(--skin-title-color)' }} />
        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--skin-font-display)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('gameFrame.questWindow.chronicle')}
        </span>
        <span style={{ fontFamily: 'var(--skin-font-display)', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: TONE.secondary }}>
          {run.log.length}
        </span>
        <span data-hud-controls="" style={{ display: 'inline-flex' }}>
          <button type="button" aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')} onClick={onClose}>
            <EngravedIcon id="cmd-close" />
          </button>
        </span>
      </div>
      <ul
        className="quest-s1-scroll"
        data-testid="quest-log-list"
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}
      >
        {run.log.length === 0 && (
          <li style={{ fontFamily: 'var(--skin-font-serif)', fontStyle: 'italic', fontSize: 12, color: TONE.muted }}>{t('gameFrame.questWindow.logEmpty')}</li>
        )}
        {run.log.map((e, i) => (
          <li key={i} style={{ fontFamily: 'var(--skin-font-serif)', fontSize: 13, lineHeight: 1.4, color: TONE[LOG_TONE[e.kind] ?? 'secondary'] }}>
            {e.text}
          </li>
        ))}
      </ul>
    </HudPlaque>
  );
};

export default QuestLogPanel;
