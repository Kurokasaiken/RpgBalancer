/**
 * HudRealMemorial — PLAN-113/114 E2 port: the Memoriale in the signed 8-A "nicchie" form
 * (a hall of carved arched niches, one per fallen resident). Real data: the same
 * `useMinimalGameplayStore(s => s.memorial)` the production MemorialPanel reads — the log is
 * written by the settlement, never edited here. Empty hall shows the real empty line.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import type { MemorialEntry } from '@/ui/idleVillage/memorial/memorialHall';
import { Z, ZanaraPlaque, ZanaraButton, OrnGem } from './zanaraOrn';

/** One carved niche — arched cap, fallen-soul silhouette, name/level/place/day on a stone plate. */
const Niche: React.FC<{ entry: MemorialEntry }> = ({ entry }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <li
      data-testid="hudreal-memorial-niche"
      style={{
        listStyle: 'none', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px 10px 10px', borderRadius: '40px 40px 10px 10px',
        border: `1.5px solid ${Z.goldDark}`,
        background: `linear-gradient(180deg, #152a2c 0%, ${Z.fieldDark} 78%)`,
        boxShadow: `inset 0 0 0 1px ${Z.goldDeep}, inset 0 6px 14px rgba(0,0,0,.55)`,
      }}
    >
      {/* the arched soul-window — a dim votive light where the portrait would hang */}
      <div
        aria-hidden
        style={{
          flex: 'none', width: 44, height: 58, borderRadius: '22px 22px 6px 6px',
          border: `1.5px solid ${Z.gold}`, position: 'relative',
          background: `radial-gradient(ellipse at 50% 78%, ${Z.emerald}2e, transparent 62%), linear-gradient(180deg, #0a1618, #060f11)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="22" height="30" viewBox="0 0 22 30" aria-hidden="true">
          <path d="M11 3 C15 8 16.5 12 11 16 C5.5 12 7 8 11 3 Z" fill={`${Z.emerald}55`} stroke={Z.emerald} strokeWidth="0.8" />
          <rect x="10" y="16" width="2" height="8" rx="1" fill={Z.goldDark} />
        </svg>
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 15, letterSpacing: 1.2, color: Z.goldHi, textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,.7)' }}>{entry.name}</span>
        <span style={{ font: 'italic 13px "EB Garamond", serif', color: Z.muted }}>
          {t('gameFrame.menu.memorialLevel', { level: entry.level })}
          {' · '}{entry.place}
          {' · '}{t('gameFrame.menu.memorialDay', { day: entry.day })}
        </span>
      </div>
      <div aria-hidden style={{ marginLeft: 'auto', flex: 'none' }}><OrnGem size={10} /></div>
    </li>
  );
};

export const HudRealMemorial: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation('idleVillage');
  const entries = useMinimalGameplayStore((s) => s.memorial);
  return (
    <ZanaraPlaque
      title={t('gameFrame.menu.memorialTitle')}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div data-testid="hudreal-memorial" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
        {entries.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', font: 'italic 15px "EB Garamond", serif', color: Z.muted }}>
            {t('gameFrame.menu.memorialEmpty')}
          </div>
        ) : (
          <ol style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map((e) => <Niche key={e.key} entry={e} />)}
          </ol>
        )}
      </div>
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 14px' }}>
          <ZanaraButton tone="iron" onClick={onClose}>{t('gameFrame.menu.close')}</ZanaraButton>
        </div>
      )}
    </ZanaraPlaque>
  );
};

export default HudRealMemorial;
