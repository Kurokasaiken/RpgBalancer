/**
 * @trailer-only
 *
 * TeaserImpactOverlay — full-screen cinematic impact vignette.
 *
 * This component is part of the Steam teaser trailer production pipeline.
 * It is exempt from gameplay architecture requirements but must preserve
 * presentation architecture requirements.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 */

import React from 'react';

export interface TeaserImpactOverlayProps {
  /** Whether the overlay is visible. */
  visible?: boolean;
  /** Intensity of the vignette from 0 (none) to 1 (full). */
  intensity?: number;
  /** Optional class name. */
  className?: string;
}

/**
 * Full-screen radial vignette with a subtle shock-wave ring.
 *
 * Renders a dark edge that isolates the center of the frame and a short
 * pulsing ring to sell the "impact" beat in the Consequence scene.
 */
export const TeaserImpactOverlay: React.FC<TeaserImpactOverlayProps> = ({
  visible = true,
  intensity = 1,
  className,
}) => {
  if (!visible) return null;

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(0,0,0,${0.55 * intensity}) 100%)`,
        zIndex: 50,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '45%',
          width: '12vmin',
          height: '12vmin',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: '2px solid rgba(216,177,62,0.35)',
          animation: 'trailer-impact-pulse 1.2s ease-out forwards',
          opacity: intensity,
        }}
      />
    </div>
  );
};
