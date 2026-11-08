/**
 * HudRealReliquary — PLAN-113/114 E3 port: the legacy reliquary in the signed Zanara
 * inheritance-table form (three carved columns — ITEMS / HEROES / BLUEPRINTS — with gemmed
 * slots). Same semantics as production `LegacyReliquaryPanel`: slot counts come from the real
 * `legacySlotsFor(villageBuildingLevel)` (village building levels, config-first), picks are a
 * mock kept in memory only (inheritance ruling pending, see PLAN-067 T-C4) — nothing is saved.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LEGACY_RELIQUARY_CATEGORIES, legacySlotsFor, villageBuildingLevel, type LegacyCategory } from '@/ui/idleVillage/legacy/legacyReliquary';
import { Z, ZanaraPlaque, ZanaraButton, OrnGem } from './zanaraOrn';

export const HudRealReliquary: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation('idleVillage');
  const slots = legacySlotsFor(villageBuildingLevel);
  const [picked, setPicked] = useState<Partial<Record<LegacyCategory, number>>>({});
  return (
    <ZanaraPlaque
      title={t('gameFrame.legacy.title')}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div role="dialog" aria-label={t('gameFrame.legacy.title')} data-testid="hudreal-reliquary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '14px 16px 12px', flex: 1, minHeight: 0 }}>
        {LEGACY_RELIQUARY_CATEGORIES.map((category) => (
          <section
            key={category}
            data-testid={`hudreal-reliquary-col-${category}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minHeight: 0,
              border: `1.5px solid ${Z.gold}`, borderRadius: 10,
              background: 'linear-gradient(180deg, #0e2226, #07121a)',
              boxShadow: `inset 0 0 0 1px ${Z.goldDeep}, inset 0 2px 10px rgba(0,0,0,.5)`,
              padding: '10px 8px',
            }}
          >
            <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 11.5, letterSpacing: 2, textTransform: 'uppercase', color: Z.goldHi, textShadow: '0 1px 2px rgba(0,0,0,.7)' }}>
              {t(`gameFrame.legacy.category.${category}`)}
            </span>
            <div aria-hidden style={{ alignSelf: 'stretch', height: 1, background: `linear-gradient(90deg, transparent, ${Z.gold}, transparent)` }} />
            {slots[category] === 0 ? (
              <span style={{ font: 'italic 13px "EB Garamond", serif', color: Z.muted, textAlign: 'center', padding: '6px 4px' }}>{t('gameFrame.legacy.noSlots')}</span>
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
                      width: '100%', height: 40, borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      border: active ? `1.5px solid ${Z.goldHi}` : `1px solid ${Z.goldDark}`,
                      background: active
                        ? `radial-gradient(ellipse at 50% 30%, ${Z.emeraldGlow}33, ${Z.fieldDark} 75%)`
                        : 'linear-gradient(180deg, #122a28, #0a1917)',
                      color: Z.goldHi, fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 12, letterSpacing: 1.5,
                      boxShadow: active ? `0 0 12px ${Z.emerald}55, inset 0 1px 4px rgba(0,0,0,.5)` : 'inset 0 1px 4px rgba(0,0,0,.5)',
                    }}
                  >
                    <OrnGem size={12} />
                    {i + 1}
                  </button>
                );
              })
            )}
          </section>
        ))}
      </div>
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 14px' }}>
          <ZanaraButton tone="iron" onClick={onClose}>{t('gameFrame.menu.cancel')}</ZanaraButton>
        </div>
      )}
    </ZanaraPlaque>
  );
};

export default HudRealReliquary;
