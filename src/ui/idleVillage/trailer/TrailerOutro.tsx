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
import { WanderlustSurface } from '@/ui/wanderlust-surface/WanderlustSurface';
import { V9GlassLayers } from '@/ui/v9-skin/V9GlassLayers';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
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
    <div
      className={`trailer-root trailer-background ${captureMode ? 'trailer-capture-mode' : ''}`}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <V9GlassLayers
        variant="base"
        style={{
          position: 'absolute',
          inset: 0,
          fontFamily: 'inherit',
        }}
      />

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
        style={{
          color: 'var(--trailer-parchment, #ede0c4)',
          fontSize: 'clamp(14px, 2.5vw, 24px)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          opacity: 0,
          zIndex: 20,
          animation: 'fadeIn 0.8s ease 0.6s forwards',
          marginBottom: '3rem',
        }}
      >
        {scene.tagline}
      </p>

      <WanderlustSurface
        shape="badge"
        material="bronze"
        interactive={false}
        className="trailer-ws-badge"
        style={{
          borderRadius: '999px',
          opacity: 0,
          animation: 'fadeIn 0.8s ease 1.2s forwards',
          zIndex: 20,
        }}
      >
        <button
          type="button"
          onClick={handleCta}
          style={{
            position: 'relative',
            padding: '1rem 2.5rem',
            borderRadius: '999px',
            border: '2px solid var(--trailer-gold, #d8b13e)',
            background: 'rgba(6, 6, 8, 0.85)',
            color: 'var(--trailer-gold-bright, #f0cf6a)',
            fontSize: 'clamp(16px, 2.2vw, 22px)',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            animation: 'trailer-cta-pulse 2.2s ease-in-out 2s infinite',
            boxShadow: '0 0 0 rgba(216,177,62,0)',
          }}
        >
          {scene.cta}
        </button>
      </WanderlustSurface>
    </div>
  );
};
