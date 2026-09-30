import React from 'react';
import { useTranslation } from 'react-i18next';
import { MatericButton } from '@/ui/designSystem/primitives';

export interface SpeedControlProps {
  speedMultiplier: number;
  availableSpeeds: number[];
  onSpeedChange: (speed: number) => void;
}

/**
 * Simulation speed — a real control with no home in the reference mockup, so
 * it takes the corner the mockup reserves for utility controls rather than
 * being dropped into a cluster whose job is something else.
 *
 * Deliberately the quietest interactive thing on screen: v1 rendered these
 * as four solid-gold plates, which made transport controls the brightest
 * pixels in the game and spent the whole luminance budget on them.
 */
export const SpeedControl: React.FC<SpeedControlProps> = ({
  speedMultiplier,
  availableSpeeds,
  onSpeedChange,
}) => {
  const { t } = useTranslation('idleVillage');

  return (
    <div role="group" aria-label={t('gameFrame.speed.ariaLabel')} style={{ display: 'flex', gap: 3 }}>
      {availableSpeeds.map((speed) => {
        const active = speed === speedMultiplier;
        return (
          <MatericButton
            key={speed}
            variant="secondary"
            aria-pressed={active}
            onClick={() => onSpeedChange(speed)}
            style={{
              padding: '3px 9px',
              fontSize: 9,
              opacity: active ? 1 : 0.45,
              borderColor: active ? 'var(--skin-title-color, #f0cf6a)' : undefined,
            }}
          >
            ×{speed}
          </MatericButton>
        );
      })}
    </div>
  );
};

export default SpeedControl;
