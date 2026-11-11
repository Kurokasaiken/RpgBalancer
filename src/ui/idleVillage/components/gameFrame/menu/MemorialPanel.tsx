/**
 * MemorialPanel — the Memoriale (PLAN-067 T-C5, R-234, DEATH-1 = B): one line per fallen resident, oldest
 * first. Read-only; the log is written by the settlement, never edited here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GameMenuDialog } from './GameMenuDialog';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

export const MemorialPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation('idleVillage');
  const entries = useMinimalGameplayStore((s) => s.memorial);
  /* Through the shared menu shell (2026-11-11): Esc closes it, focus returns, veil, and the page's dress (Zanara on /game). */
  return (
    <GameMenuDialog title={t('gameFrame.menu.memorialTitle')} onClose={onClose} width={420} data-testid="memorial-panel">
      <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
      {entries.length === 0 ? (
        <span style={{ font: 'italic 14px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>{t('gameFrame.menu.memorialEmpty')}</span>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e) => (
            <li key={e.key} data-testid="memorial-entry" style={{ font: '15px var(--skin-font-serif)', color: 'var(--skin-text-primary)' }}>
              <b style={{ font: '600 15px var(--skin-font-display)', color: 'var(--skin-title-color)' }}>{e.name}</b>
              {' · '}{t('gameFrame.menu.memorialLevel', { level: e.level })}
              {' · '}{e.place}
              {' · '}{t('gameFrame.menu.memorialDay', { day: e.day })}
            </li>
          ))}
        </ol>
      )}
      </div>
    </GameMenuDialog>
  );
};

export default MemorialPanel;
