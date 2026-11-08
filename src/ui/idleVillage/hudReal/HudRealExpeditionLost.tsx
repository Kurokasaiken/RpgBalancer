/**
 * HudRealExpeditionLost — PLAN-113/114 F4 port: the wipe report in the signed 10-B form —
 * the winged product emblem (`hud-real/C1/emblem.webp`) dimmed like a spent medallion over
 * the tombstones of the fallen. Real semantics: tombs come from the real
 * `lostReportModel(run, clock)` (one per `resident-dead`, day only when the run recorded it);
 * copy is the production epilogue/outcome i18n. The emblem asset is the deployed product one.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { lostReportModel, type LostDayClock } from '@/ui/idleVillage/components/gameFrame/expeditionLost';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { Z, ZanaraPlaque, ZanaraButton } from './zanaraOrn';

const EMBLEM_SRC = '/assets/ui/hud-real/C1/emblem.webp';

export interface HudRealExpeditionLostProps {
  /** The wiped run — the real settlement state; only `party` is read by the model. */
  run: QuestRunState;
  /** Quest display name for the outcome line («{quest}»). */
  questName: string;
  /** Optional day clock — when absent, tombs show no day (same rule as production). */
  clock?: LostDayClock;
  onClose?: () => void;
}

export const HudRealExpeditionLost: React.FC<HudRealExpeditionLostProps> = ({ run, questName, clock, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const tombs = useMemo(() => lostReportModel(run, clock).tombs, [run, clock]);
  return (
    <div data-testid="hudreal-lost-layer" style={{ position: 'fixed', inset: 0, zIndex: 2600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 45%, rgba(6,18,20,.62), rgba(2,7,9,.85))' }}>
      <ZanaraPlaque style={{ width: 520, maxWidth: '92vw' }}>
        {/* the spent emblem — the product winged sigil, dimmed and cold */}
        <div aria-hidden style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 6px' }}>
          <img
            src={EMBLEM_SRC} alt="" draggable={false}
            style={{ width: 150, height: 'auto', filter: 'saturate(.38) brightness(.72) sepia(.18) drop-shadow(0 8px 22px rgba(0,0,0,.8))' }}
          />
        </div>
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 21, letterSpacing: 4, textTransform: 'uppercase', color: '#cfd6cf', textShadow: '0 2px 6px rgba(0,0,0,.85)' }}>
            {t('gameFrame.questEpilogue.title')}
          </div>
          <div style={{ font: 'italic 15.5px "EB Garamond", serif', color: Z.muted, marginTop: 6 }}>
            {t('gameFrame.questLog.outcome.wipe', { quest: questName })}
          </div>
        </div>
        <div aria-hidden style={{ height: 1, margin: '14px 22px 0', background: `linear-gradient(90deg, transparent, ${Z.gold}88, transparent)` }} />
        <div style={{ padding: '12px 22px 4px' }}>
          <div style={{ textAlign: 'center', fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: Z.muted, marginBottom: 10 }}>
            {t('gameFrame.questEpilogue.dead')}
          </div>
          {tombs.length === 0 ? (
            <div style={{ textAlign: 'center', font: 'italic 14px "EB Garamond", serif', color: Z.muted, padding: '6px 0 10px' }}>—</div>
          ) : (
            <div data-testid="hudreal-lost-tombs" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {tombs.map((tomb) => (
                <div
                  key={tomb.id}
                  data-testid="hudreal-lost-tomb"
                  style={{
                    width: 96, padding: '9px 6px 7px', textAlign: 'center', borderRadius: '48px 48px 6px 6px',
                    border: `1.5px solid ${Z.goldDark}`,
                    background: `linear-gradient(180deg, #17272a 0%, ${Z.fieldDark} 80%)`,
                    boxShadow: `inset 0 0 0 1px ${Z.goldDeep}, inset 0 5px 12px rgba(0,0,0,.55)`,
                  }}
                >
                  <EngravedIcon id="status-fallen" size={17} aria-hidden style={{ color: '#9fb4ac' }} />
                  <div style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#d3ded8', marginTop: 4 }}>{tomb.name}</div>
                  {tomb.day !== null && <div style={{ font: 'italic 12px "EB Garamond", serif', color: Z.muted }}>{t('gameFrame.questWindow.fellOnDay', { day: tomb.day })}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 18px' }}>
            <ZanaraButton tone="gold" onClick={onClose}>{t('gameFrame.questWindow.rewardClose')}</ZanaraButton>
          </div>
        )}
      </ZanaraPlaque>
    </div>
  );
};

export default HudRealExpeditionLost;
