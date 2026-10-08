/**
 * questS1Lab/hud/ChronicleDrawer — local read-only chronicle drawer
 * (Director D3, PLAN-024: stays local to the lab — no /game panel-system
 * integration). Lacquer surface, entry tones from skin tokens.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { Kicker, LOG_TONE, TONE } from './atoms';

/** Log drawer — overlay on the right edge, never a column in the cockpit. */
export const ChronicleDrawer: React.FC<{
  log: QuestRunState['log'];
  onClose: () => void;
}> = ({ log, onClose }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col"
      style={{
        borderLeft: '1px solid var(--skin-surface-border)',
        background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 96%, transparent)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid color-mix(in srgb, var(--skin-surface-border) 50%, transparent)' }}
      >
        <Kicker>{t('questS1Lab.chronicle')}</Kicker>
        <button
          type="button"
          onClick={onClose}
          data-skin="close"
          aria-label={t('questS1Lab.chronicle')}
        >
          ✕
        </button>
      </div>
      <div className="quest-s1-scroll flex-1 space-y-1 overflow-y-auto p-3" style={{ fontFamily: 'var(--skin-font-serif)' }}>
        {log.map((e, i) => (
          <div
            key={i}
            style={{
              fontSize: PRES.type.labelPx,
              lineHeight: 1.45,
              color: TONE[LOG_TONE[e.kind] ?? 'secondary'],
            }}
          >
            <span style={{ color: TONE.muted }}>[{e.kind}]</span> {e.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChronicleDrawer;
