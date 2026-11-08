/**
 * HudRealLedgerPanel — PLAN-113 pilot E (cronaca). Port of the /game event ledger
 * onto the Zanara pf-3 frame: real `HudEvent` rows (icon, title, days-left), a kit
 * divider between rows, rows scroll inside the free zone like `HudEventLedger`.
 * Production parity (E-13): same row model and i18n, only the dressing changes.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HudRealPanel } from './HudRealPanel';
import { HudGlyph } from '@/ui/idleVillage/components/gameFrame/hudIcons';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { HudEvent } from '@/ui/idleVillage/components/gameFrame';

const C = { ink: '#2b2118', muted: '#6b5a3e' } as const;
const iconFor = (typeId: string): string =>
  DEFAULT_GAME_FRAME_CONFIG.eventLedger.types.find((tp) => tp.id === typeId)?.icon ?? 'chronicle';

export interface HudRealLedgerPanelProps {
  events: readonly HudEvent[];
  onSelect?: (event: HudEvent) => void;
}

export const HudRealLedgerPanel: React.FC<HudRealLedgerPanelProps> = ({ events, onSelect }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <HudRealPanel
      kicker={t('gameFrame.events.kicker', 'Cronaca')}
      title={t('gameFrame.events.title', 'Eventi del regno')}
      illustration={<img src="/assets/ui/hud-real/kit/medallion.png" alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
      ariaLabel={t('gameFrame.events.title', 'Eventi del regno')}
    >
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', maxWidth: '100%', maxHeight: '100%', overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {events.length === 0 && (
          <li style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>{t('gameFrame.events.empty', 'Nessun evento in vista.')}</li>
        )}
        {events.map((ev, i) => (
          <li key={ev.id} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {i > 0 && <img src="/assets/ui/hud-real/kit/divider.png" alt="" draggable={false} style={{ width: '100%', height: 10, objectFit: 'cover', objectPosition: 'center', display: 'block', margin: '5px 0 3px' }} />}
            <button
              type="button"
              onClick={() => onSelect?.(ev)}
              style={{ all: 'unset', cursor: onSelect ? 'pointer' : 'default', display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}
            >
              <span aria-hidden="true" style={{ color: C.muted, display: 'inline-flex', paddingTop: 2 }}><HudGlyph iconId={iconFor(ev.typeId) as never} size={16} /></span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{ev.title}</span>
                <span style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
                  {ev.daysLeft <= 0 ? t('gameFrame.events.today', 'oggi') : t('gameFrame.events.inDays', { count: ev.daysLeft, defaultValue: `tra ${ev.daysLeft} gg` })}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </HudRealPanel>
  );
};

export default HudRealLedgerPanel;
