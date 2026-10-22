/**
 * MemorialPanel — the Memoriale (PLAN-067 T-C5, R-234, DEATH-1 = B): one line per fallen resident, oldest
 * first. Read-only; the log is written by the settlement, never edited here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

export const MemorialPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation('idleVillage');
  const entries = useMinimalGameplayStore((s) => s.memorial);
  return (
    <HudPlaque
      shape="panel"
      as="section"
      role="dialog"
      aria-label={t('gameFrame.menu.memorialTitle')}
      data-testid="memorial-panel"
      style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2600, width: 420, maxHeight: '70vh', overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: '600 13px var(--skin-font-display)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>{t('gameFrame.menu.memorialTitle')}</span>
        <button type="button" onClick={onClose}>{t('gameFrame.menu.cancel')}</button>
      </div>
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
    </HudPlaque>
  );
};

export default MemorialPanel;
