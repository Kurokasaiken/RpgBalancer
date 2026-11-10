/**
 * HudRealExpeditionLost — PLAN-113/114 F4 port (F3 art pass 2026-11-09):
 * `/assets/ui/hud-real/lost/frame.webp` (1408×768 RGBA) is the circular cut-out,
 * text-free frame asset extracted from the signed `s10b-emblem` mockup: cracked
 * circular emerald frame, winged product emblem, clean metal ribbon, clean stone
 * slab, and clean emerald button plaque.
 * Zero opaque cover patches: localized title, wipe line, real `lostReportModel`
 * tombs, and the close button sit directly on the painted ribbon, stone slab,
 * and emerald plaque.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { lostReportModel, type LostDayClock } from '@/ui/idleVillage/components/gameFrame/expeditionLost';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';

const FRAME_SRC = '/assets/ui/hud-real/lost/frame.webp';
const ART_W = 1408;
const ART_H = 768;
const C = { ink: '#251e18', stoneSub: '#3f352c', goldHi: '#f0d68a' } as const;

interface Zone { x: number; y: number; w: number; h: number }
const Z = {
  ribbon: { x: 495, y: 424, w: 418, h: 66 },
  plaque: { x: 420, y: 506, w: 568, h: 164 },
  button: { x: 510, y: 694, w: 388, h: 52 },
} satisfies Record<string, Zone>;

const pct = (z: Zone): React.CSSProperties => ({
  position: 'absolute',
  left: `${(z.x / ART_W) * 100}%`,
  top: `${(z.y / ART_H) * 100}%`,
  width: `${(z.w / ART_W) * 100}%`,
  height: `${(z.h / ART_H) * 100}%`,
});

export interface HudRealExpeditionLostProps {
  run: QuestRunState;
  questName: string;
  clock?: LostDayClock;
  onClose?: () => void;
}

export const HudRealExpeditionLost: React.FC<HudRealExpeditionLostProps> = ({ run, questName, clock, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const tombs = useMemo(() => lostReportModel(run, clock).tombs, [run, clock]);
  return (
    <div
      data-testid="hudreal-lost-layer"
      style={{
        position: 'fixed', inset: 0, zIndex: 2600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 45%, rgba(6,18,20,.55), rgba(2,7,9,.82))',
      }}
    >
      <div style={{ position: 'relative', width: 'min(1040px, 92vw)', aspectRatio: `${ART_W} / ${ART_H}`, containerType: 'size', filter: 'drop-shadow(0 20px 60px rgba(0,0,0,.78))' }}>
        <img src={FRAME_SRC} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

        {/* Engraved title directly on the clean painted metal ribbon */}
        <div style={{ ...pct(Z.ribbon), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '3.2cqh', fontWeight: 800,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1b1610',
            textShadow: '0 1px 0 rgba(255,235,180,.55)',
          }}>
            {t('gameFrame.questEpilogue.title')}
          </span>
        </div>

        {/* Real wipe line + tombs directly on the clean painted stone slab */}
        <div style={{ ...pct(Z.plaque), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8cqh', padding: '1cqh 2cqw' }}>
          <div style={{ font: 'italic 2.1cqh "EB Garamond", serif', color: C.stoneSub, textAlign: 'center' }}>
            {t('gameFrame.questLog.outcome.wipe', { quest: questName })}
          </div>
          <div style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '1.9cqh', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.ink }}>
            {t('gameFrame.questEpilogue.dead')}
          </div>
          {tombs.length === 0 ? (
            <span style={{ font: 'italic 2.2cqh "EB Garamond", serif', color: C.stoneSub }}>—</span>
          ) : (
            <div data-testid="hudreal-lost-tombs" style={{ display: 'flex', gap: '1.2cqw', flexWrap: 'wrap', justifyContent: 'center' }}>
              {tombs.map((tomb) => (
                <div
                  key={tomb.id}
                  data-testid="hudreal-lost-tomb"
                  style={{
                    width: '8.5cqw', padding: '0.6cqh 0.4cqw', textAlign: 'center',
                    borderRadius: '3.8cqw 3.8cqw 0.5cqw 0.5cqw',
                    border: '1.5px solid #6e5a34',
                    background: 'linear-gradient(180deg,#17272a,#07121a)',
                    boxShadow: '0 2px 6px rgba(0,0,0,.45)',
                  }}
                >
                  <EngravedIcon id="status-fallen" size={14} aria-hidden style={{ color: '#9fb4ac' }} />
                  <div style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '1.7cqh', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#e6efe9', marginTop: '0.2cqh' }}>
                    {tomb.name}
                  </div>
                  {tomb.day !== null && (
                    <div style={{ font: 'italic 1.6cqh "EB Garamond", serif', color: '#9db5ab' }}>
                      {t('gameFrame.questWindow.fellOnDay', { day: tomb.day })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button directly on the clean painted emerald plaque at the bottom */}
        <button
          type="button"
          onClick={onClose}
          style={{
            ...pct(Z.button), padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '2.3cqh', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: C.goldHi,
            textShadow: '0 1px 4px rgba(0,0,0,.9)',
          }}
        >
          {t('gameFrame.questWindow.rewardClose')}
        </button>
      </div>
    </div>
  );
};

export default HudRealExpeditionLost;
