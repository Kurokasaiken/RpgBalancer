/**
 * @trailer-only
 *
 * TrailerThreatComponent — isolated threat announcement card.
 *
 * A design-system-native take on the goblin invasion reveal: uses
 * WanderlustSurface, SkinScope, SkinTitle and the existing V9 skin tokens.
 * This is just the card, not the full scene; it is meant to be dropped into
 * the pergamena-cloud reveal animation later.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 */

import React, { useEffect, useState } from 'react';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';
import { SkinScope, SkinTitle, SkinBadge, SkinButton } from '@/ui/idleVillage/skins/primitives';
import { FIELD_BACKGROUND, FIELD_VIGNETTE } from '@/ui/visualFidelityLab/foundationRecipe';

export interface TrailerThreatComponentProps {
  /** Whether the entrance animation plays on mount. */
  autoPlay?: boolean;
  /** Optional callback when the user clicks replay. */
  onReplay?: () => void;
}

/**
 * Renders the goblin-invasion threat card with a V9 design-system surface.
 *
 * The card is deliberately isolated: no map, no clouds, no split animation.
 * It is the component that will later appear out of the pergamena cloud,
 * then split into the map goblin markers and the top-right countdown.
 */
export const TrailerThreatComponent: React.FC<TrailerThreatComponentProps> = ({
  autoPlay = true,
  onReplay,
}) => {
  const scene = trailerConfig.threat;
  const [phase, setPhase] = useState<'ready' | 'in' | 'idle'>(autoPlay ? 'ready' : 'idle');

  useEffect(() => {
    if (!autoPlay) return undefined;
    const enterTimer = window.setTimeout(() => setPhase('in'), 40);
    const settleTimer = window.setTimeout(() => setPhase('idle'), 1200);
    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(settleTimer);
    };
  }, [autoPlay]);

  const handleReplay = () => {
    setPhase('ready');
    window.setTimeout(() => setPhase('in'), 40);
    window.setTimeout(() => setPhase('idle'), 1200);
    onReplay?.();
  };

  return (
    <div className={`trailer-threat-component trailer-threat-component--${phase}`}>
      <WanderlustSurface
        shape="panel"
        material="bronze"
        interactive={false}
        className="trailer-threat-component__surface"
      >
        <WanderlustAmbientField
          fireflyCount={6}
          style={{
            background: FIELD_BACKGROUND,
            boxShadow: FIELD_VIGNETTE,
            borderRadius: 'inherit',
          }}
        >
          <SkinScope className="trailer-threat-component__content">
            <SkinBadge className="trailer-threat-component__plaque">
              {scene.eventPlaque}
            </SkinBadge>
            <SkinTitle level="1" className="trailer-threat-component__title">
              {scene.announcement.title}
            </SkinTitle>
            <SkinTitle level="subtitle" className="trailer-threat-component__subtitle">
              {scene.announcement.subtitle}
            </SkinTitle>
            <div className="trailer-threat-component__sticker">
              <img src={encodeURI(scene.goblinImage)} alt="" />
            </div>
            <div className="trailer-threat-component__ring">
              <svg viewBox="0 0 100 100" className="trailer-threat-component__ring-svg">
                <circle cx="50" cy="50" r="46" className="trailer-threat-component__ring-track" />
                <circle cx="50" cy="50" r="46" className="trailer-threat-component__ring-progress" />
              </svg>
              <span className="trailer-threat-component__ring-number">
                {scene.announcement.timerRing.number}
              </span>
            </div>
            <span className="trailer-threat-component__days">
              {scene.announcement.timerRing.daysText}
            </span>
            {onReplay && (
              <SkinButton className="trailer-threat-component__replay" onClick={handleReplay}>
                Replay
              </SkinButton>
            )}
          </SkinScope>
        </WanderlustAmbientField>
      </WanderlustSurface>
    </div>
  );
};

export default TrailerThreatComponent;
