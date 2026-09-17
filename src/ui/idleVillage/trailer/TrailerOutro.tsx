/**
 * @trailer-only
 *
 * TrailerOutro — Scene 7: Outro (WANDERLUST TRIUMPH + wishlist CTA).
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

import React, { useEffect } from 'react';
import { MatericButton } from '@/ui/designSystem/primitives';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { TrailerSceneShell } from './TrailerSceneShell';
import type { TrailerSceneProps } from './types';
import './trailer.css';

/**
 * Scene 7 — Title card with "WANDERLUST TRIUMPH", tagline, and an animated
 * Steam wishlist CTA.
 */
export const TrailerOutro: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.outro;

  useEffect(() => {
    if (!autoStart || !onComplete) return undefined;
    const timer = window.setTimeout(onComplete, scene.duration);
    return () => window.clearTimeout(timer);
  }, [autoStart, onComplete, scene.duration]);

  const handleCta = () => {
    if (typeof window !== 'undefined' && scene.steamUrl) {
      window.open(scene.steamUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <TrailerSceneShell
      captureMode={captureMode}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <h1
        className="trailer-banner"
        style={{
          fontSize: 'clamp(36px, 7vw, 84px)',
          letterSpacing: '0.08em',
          zIndex: 20,
          marginBottom: '1.25rem',
        }}
      >
        {scene.title}
      </h1>

      <p
        className="trailer-subtitle"
        style={{
          fontSize: 'clamp(14px, 2.5vw, 24px)',
          animationDelay: '0.6s',
          zIndex: 20,
          marginBottom: '3rem',
        }}
      >
        {scene.tagline}
      </p>

      <div
        style={{
          opacity: 0,
          animation: 'fadeIn 0.8s ease 1.2s forwards, trailer-cta-glow 2.2s ease-in-out 2s infinite',
          zIndex: 20,
        }}
      >
        <MatericButton
          variant="cta"
          ornaments
          onClick={handleCta}
          style={{ fontSize: 'clamp(14px, 1.8vw, 18px)' }}
        >
          {scene.cta}
        </MatericButton>
      </div>
    </TrailerSceneShell>
  );
};
