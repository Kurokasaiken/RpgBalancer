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
import { MatericSurface, MatericPlaque, MatericTitleSep } from '@/ui/designSystem/primitives';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { TrailerSceneShell } from './TrailerSceneShell';
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
    <TrailerSceneShell captureMode={captureMode}>
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
        <p className="trailer-subtitle" style={{ animationDelay: '0.5s' }}>
          {scene.subtitle}
        </p>
        <MatericTitleSep
          ornament="✦"
          style={{ width: 'min(460px, 52vw)', margin: '14px auto 0', opacity: 0, animation: 'fadeIn 0.8s ease 0.9s forwards' }}
        />
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
            <MatericSurface shape="card" material="bronze" interactive={false}>
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
                <MatericPlaque>{item.category}</MatericPlaque>
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
                    border: '1px solid var(--skin-status-met)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--skin-status-met)',
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
            </MatericSurface>
          </div>
        ))}
      </div>
    </TrailerSceneShell>
  );
};
