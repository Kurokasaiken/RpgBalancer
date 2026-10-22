/**
 * LegacyReliquaryPanel — the legacy reliquary on /game (PLAN-067 T-C4, R-234, LEG = B). Three columns (items,
 * heroes, blueprints); each has as many slots as its village building's level. Picking a slot is a MOCK choice
 * kept in memory only (the ruling is pending): nothing is saved and nothing is inherited yet.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { LEGACY_RELIQUARY_CATEGORIES, legacySlotsFor, villageBuildingLevel, type LegacyCategory } from './legacyReliquary';

export const LegacyReliquaryPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation('idleVillage');
  const slots = legacySlotsFor(villageBuildingLevel);
  const [picked, setPicked] = useState<Partial<Record<LegacyCategory, number>>>({});
  return (
    <HudPlaque
      shape="panel"
      as="section"
      role="dialog"
      aria-label={t('gameFrame.legacy.title')}
      data-testid="legacy-reliquary"
      style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.reward, width: 520, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: '600 13px var(--skin-font-display)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>{t('gameFrame.legacy.title')}</span>
        <button type="button" onClick={onClose}>{t('gameFrame.menu.cancel')}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {LEGACY_RELIQUARY_CATEGORIES.map((category) => (
          <section key={category} data-testid={`legacy-column-${category}`} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <span style={{ font: '600 12px var(--skin-font-display)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--skin-label-primary)' }}>{t(`gameFrame.legacy.category.${category}`)}</span>
            {slots[category] === 0 ? (
              <span style={{ font: 'italic 13px var(--skin-font-serif)', color: 'var(--skin-text-secondary)' }}>{t('gameFrame.legacy.noSlots')}</span>
            ) : (
              Array.from({ length: slots[category] }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  data-testid={`legacy-slot-${category}-${i}`}
                  aria-pressed={picked[category] === i}
                  onClick={() => setPicked((p) => ({ ...p, [category]: i }))}
                  style={{ width: 56, height: 36, borderRadius: 6, border: picked[category] === i ? '1.5px solid var(--skin-title-color)' : '1px solid var(--skin-hud-brass-hi)', background: 'var(--skin-hud-lacquer-deep)', color: 'var(--skin-title-color)', font: '600 12px var(--skin-font-display)' }}
                >
                  {i + 1}
                </button>
              ))
            )}
          </section>
        ))}
      </div>
    </HudPlaque>
  );
};

export default LegacyReliquaryPanel;
