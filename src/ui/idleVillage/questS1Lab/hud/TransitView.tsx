/**
 * questS1Lab/hud/TransitView — transition beat between phases (PLAN-024):
 * the destination node's `transit` line over its scene art, on skin tokens.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { FadeIn, Kicker } from './atoms';

/**
 * Transition beat between phases — the destination node's `transit` line over
 * its scene art, holding for `pacing.transitMs`. In the real game this sits
 * under the party's movement animation; here it IS the animation.
 * Falls back to the plain «advancing» strip when the node has no transit.
 */
export const TransitView: React.FC<{
  transit?: string;
  art?: { src: string; fit: 'contain' | 'cover' };
  /** Clicking the authored line skips the read-hold and advances (Director: il
   *  testo di transizione è anche il pulsante «prosegui»). */
  onAdvance?: () => void;
}> = ({ transit, art, onAdvance }) => {
  const { t } = useTranslation('idleVillage');
  if (!transit) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Kicker tone="muted">{t('questS1Lab.advancing')}</Kicker>
      </div>
    );
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAdvance}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onAdvance?.();
      }}
      title={onAdvance ? t('questS1Lab.transitSkip') : undefined}
      className="relative flex h-44 items-center justify-center overflow-hidden"
      style={{
        borderRadius: 14,
        border: '1px solid color-mix(in srgb, var(--skin-surface-border) 40%, transparent)',
        background: 'var(--skin-hud-lacquer-deep)',
        cursor: onAdvance ? 'pointer' : undefined,
      }}
    >
      {art && (
        <img
          src={art.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '50% 60%', opacity: 0.45 }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(0deg, var(--skin-hud-lacquer-deep) 0%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent) 50%, var(--skin-hud-lacquer-deep) 100%)',
        }}
      />
      <FadeIn>
        <p
          className="relative max-w-md px-6 text-center"
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
  );
};

export default TransitView;
