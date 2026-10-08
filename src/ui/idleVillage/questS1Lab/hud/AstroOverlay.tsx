/**
 * questS1Lab/hud/AstroOverlay — full-screen narrative cinematic for
 * non-combat checks (PLAN-024: chrome on skin tokens).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { FadeIn, HudChip } from './atoms';

export interface AstroOverlayProps {
  /** Unique burst entry id — remounts the FadeIn transit per check. */
  entryId: string;
  transit?: string;
  burstCurrent: number;
  burstTotal: number;
  /** The configured astrolabe element (engine verdict painted by the kit). */
  astroNode: React.ReactNode;
  onSkip: () => void;
}

/** Narrative astrolabe — full-screen cinematic for non-combat checks.
 *  Exists only during the cinematic beat; the verdict card replaces it
 *  in the Action Zone (artifact §4: verdict is a state, not a band). */
export const AstroOverlay: React.FC<AstroOverlayProps> = ({
  entryId, transit, burstCurrent, burstTotal, astroNode, onSkip,
}) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div
      className="quest-s1-scroll fixed inset-0 z-50 overflow-y-auto [&_.scene-col]:[flex:1_1_100%]"
      style={{ background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 88%, transparent)' }}
    >
      {burstTotal > 1 && (
        <div className="absolute left-4 top-4 z-10">
          <HudChip tone="label">
            {t('questS1Lab.throwCounter', { current: burstCurrent, total: burstTotal })}
          </HudChip>
        </div>
      )}
      {transit && (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex justify-center px-6">
          <FadeIn key={entryId}>
            <p
              className="max-w-xl text-center"
              style={{
                fontFamily: 'var(--skin-font-serif)',
                fontSize: PRES.type.numberPx,
                fontStyle: 'italic',
                lineHeight: 1.55,
                color: 'var(--skin-text-primary)',
                textShadow: '0 2px 10px var(--skin-hud-lacquer-deep)',
              }}
            >
              {transit}
            </p>
          </FadeIn>
        </div>
      )}
      {astroNode}
      <button
        type="button"
        onClick={onSkip}
        data-skin="button"
        className="absolute bottom-6 right-6 z-10"
      >
        {t('questS1Lab.skip')}
      </button>
    </div>
  );
};

export default AstroOverlay;
