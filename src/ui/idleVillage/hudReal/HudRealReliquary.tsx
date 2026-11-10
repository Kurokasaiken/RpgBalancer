/**
 * HudRealReliquary — PLAN-113/114 E3 port (F3 art pass 2026-11-09):
 * `/assets/ui/hud-real/reliquary/frame-v2.webp` (1216×762 RGBA) is the cut-out,
 * text-free frame asset extracted from the signed `s08-reliquary` mockup (crop
 * x=96..1312, y=4..766). Zero opaque cover patches: localized headers, real slot
 * buttons from `legacySlotsFor(villageBuildingLevel)`, and the live Confirm button
 * sit directly on the clean painted alabaster cartouche, emerald column headers,
 * recessed column wells, and bottom emerald plaque.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LEGACY_RELIQUARY_CATEGORIES, legacySlotsFor, villageBuildingLevel, type LegacyCategory } from '@/ui/idleVillage/legacy/legacyReliquary';

const FRAME_SRC = '/assets/ui/hud-real/reliquary/frame-v2.webp';
const ART_W = 1216;
const ART_H = 762;
const C = { ink: '#2b2116', muted: '#8fb2a2', goldHi: '#f0d68a', emerald: '#1fb877', emeraldGlow: '#2fd4a3' } as const;

interface Zone { x: number; y: number; w: number; h: number }
/* All coordinates offset by (-96, -4) from raw 1408×768 s08-reliquary-0.png */
const Z = {
  title: { x: 468, y: 76, w: 280, h: 68 },
  inherit: { x: 488, y: 196, w: 240, h: 42 },
  colLabels: [
    { x: 126, y: 252, w: 246, h: 42 },
    { x: 484, y: 252, w: 246, h: 42 },
    { x: 842, y: 252, w: 246, h: 42 },
  ],
  cols: [
    { x: 100, y: 316, w: 298, h: 304 },
    { x: 460, y: 316, w: 294, h: 304 },
    { x: 818, y: 316, w: 296, h: 304 },
  ],
  confirm: { x: 472, y: 686, w: 272, h: 52 },
} satisfies Record<string, Zone | Zone[]>;

const pct = (z: Zone): React.CSSProperties => ({
  position: 'absolute',
  left: `${(z.x / ART_W) * 100}%`,
  top: `${(z.y / ART_H) * 100}%`,
  width: `${(z.w / ART_W) * 100}%`,
  height: `${(z.h / ART_H) * 100}%`,
});

export const HudRealReliquary: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation('idleVillage');
  const slots = legacySlotsFor(villageBuildingLevel);
  const [picked, setPicked] = useState<Partial<Record<LegacyCategory, number>>>({});
  return (
    <div
      data-testid="hudreal-reliquary"
      role="dialog"
      aria-label={t('gameFrame.legacy.title')}
      style={{ position: 'relative', width: '100%', height: '100%', containerType: 'size', filter: 'drop-shadow(0 18px 52px rgba(0,0,0,.75))' }}
    >
      <img src={FRAME_SRC} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      {/* Title engraved on the clean pale-ivory top plaque */}
      <div style={{ ...pct(Z.title), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
          fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '4.2cqh', fontWeight: 800,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink,
          textShadow: '0 1px 0 rgba(255,248,225,.75)',
        }}>
          {t('gameFrame.legacy.title')}
        </span>
      </div>

      {/* Subtitle on the dark bronze band */}
      <div style={{ ...pct(Z.inherit), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '2.5cqh', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.goldHi }}>
          {t('gameFrame.director.legacy', 'Inheritance')}
        </span>
      </div>

      {/* Three live columns */}
      {LEGACY_RELIQUARY_CATEGORIES.map((category, ci) => (
        <React.Fragment key={category}>
          <div style={{ ...pct(Z.colLabels[ci]), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '2.6cqh', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.goldHi, textShadow: '0 1px 3px rgba(0,0,0,.85)' }}>
              {t(`gameFrame.legacy.category.${category}`)}
            </span>
          </div>
          <div
            data-testid={`hudreal-reliquary-col-${category}`}
            style={{ ...pct(Z.cols[ci]), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.8cqh', padding: '1.6cqh 1.2cqw', overflow: 'hidden' }}
          >
            {slots[category] === 0 ? (
              <span style={{ font: 'italic 2.4cqh "EB Garamond", serif', color: C.muted, textAlign: 'center' }}>
                {t('gameFrame.legacy.noSlots')}
              </span>
            ) : (
              Array.from({ length: slots[category] }, (_, i) => {
                const active = picked[category] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    data-testid={`hudreal-reliquary-slot-${category}-${i}`}
                    aria-pressed={active}
                    onClick={() => setPicked((p) => ({ ...p, [category]: i }))}
                    style={{
                      width: '88%', flex: '0 0 auto', height: `${Math.min(15, 34 / Math.max(1, slots[category]))}cqh`,
                      borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      border: active ? `2px solid ${C.emeraldGlow}` : '1.5px solid #9d7f3e',
                      background: active ? `radial-gradient(ellipse at 50% 30%, ${C.emeraldGlow}33, #081621 75%)` : 'linear-gradient(180deg,#15302c,#0a1917)',
                      color: C.goldHi, fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '2.5cqh', fontWeight: 700, letterSpacing: '0.12em',
                      boxShadow: active ? `0 0 14px ${C.emerald}66` : 'inset 0 1px 4px rgba(0,0,0,.6)',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })
            )}
          </div>
        </React.Fragment>
      ))}

      {/* CONFIRM — transparent hit button directly over the clean painted emerald plaque */}
      <button
        type="button"
        data-testid="hudreal-reliquary-confirm"
        onClick={onClose}
        disabled={!onClose}
        style={{
          ...pct(Z.confirm), padding: 0, border: 'none', background: 'transparent',
          cursor: onClose ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: '2.4cqh', fontWeight: 800,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: C.goldHi,
          textShadow: '0 1px 4px rgba(0,0,0,.9)',
        }}
      >
        {t('gameFrame.questWindow.rewardClose', 'Conferma')}
      </button>
    </div>
  );
};

export default HudRealReliquary;
