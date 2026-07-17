/**
 * @trailer-only
 *
 * TrailerLegacy — Scene 6: Legacy (knowledge preserved list).
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

import React, { useEffect, useMemo } from 'react';
import { WanderlustSurface } from '@/ui/wanderlust-surface/WanderlustSurface';
import { V9GlassLayers } from '@/ui/v9-skin/V9GlassLayers';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import type { TrailerSceneProps } from './types';
import './trailer.css';

interface LegacyItemConfig {
  id: string;
  label: string;
  icon: string;
  category: string;
}

/**
 * Scene 6 — "KNOWLEDGE PRESERVED" bronze surface cards for surviving
 * artifacts, blueprints, and heroes. Each card appears with a checkmark.
 */
export const TrailerLegacy: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.legacy;
  const items = useMemo<LegacyItemConfig[]>(() => scene.items as unknown as LegacyItemConfig[], [scene.items]);

  useEffect(() => {
    if (!autoStart || !onComplete) return undefined;
    const timer = window.setTimeout(onComplete, scene.duration);
    return () => window.clearTimeout(timer);
  }, [autoStart, onComplete, scene.duration]);

  return (
    <div
      className={`trailer-root trailer-background ${captureMode ? 'trailer-capture-mode' : ''}`}
      style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      <V9GlassLayers
        variant="base"
        style={{
          position: 'absolute',
          inset: 0,
          fontFamily: 'inherit',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '10vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <h2 className="trailer-banner" style={{ animationDelay: '0ms' }}>{scene.title}</h2>
        <p
          style={{
            marginTop: '0.75rem',
            color: 'var(--trailer-parchment, #ede0c4)',
            fontSize: 'clamp(14px, 2vw, 20px)',
            letterSpacing: '0.08em',
            opacity: 0,
            textTransform: 'uppercase',
            animation: 'fadeIn 0.8s ease 0.5s forwards',
          }}
        >
          {scene.subtitle}
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '34vh',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          zIndex: 20,
          padding: '0 2rem',
          flexWrap: 'wrap',
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            style={{
              width: 'min(300px, 26vw)',
              opacity: 0,
              animation: 'trailer-legacy-card-in 0.6s ease forwards',
              animationDelay: `${1200 + index * 700}ms`,
            }}
          >
            <WanderlustSurface shape="card" material="bronze" interactive={false}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.5rem',
                  minHeight: '180px',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>{item.icon}</div>
                <div
                  style={{
                    color: 'var(--trailer-parchment, #ede0c4)',
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    opacity: 0.7,
                  }}
                >
                  {item.category}
                </div>
                <div
                  style={{
                    color: 'var(--trailer-gold-bright, #f0cf6a)',
                    fontSize: 'clamp(18px, 2.2vw, 24px)',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(123,201,111,0.15)',
                    border: '1px solid rgba(123,201,111,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7bc96f',
                    fontSize: '16px',
                    marginTop: '0.25rem',
                    opacity: 0,
                    animation: 'fadeIn 0.5s ease forwards',
                    animationDelay: `${2000 + index * 700}ms`,
                  }}
                >
                  ✓
                </div>
              </div>
            </WanderlustSurface>
          </div>
        ))}
      </div>
    </div>
  );
};
