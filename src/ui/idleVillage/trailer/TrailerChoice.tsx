/**
 * @trailer-only
 *
 * TrailerChoice — Scene 2: Choice (village + asymmetric POI choices).
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

import React, { useEffect, useMemo, useState } from 'react';
import { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
import { MatericSurface } from '@/ui/designSystem/primitives';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { TrailerSceneShell } from './TrailerSceneShell';
import type { TrailerSceneProps } from './types';
import './trailer.css';

interface ChoiceConfig {
  id: string;
  type: 'safe' | 'high-risk';
  label: string;
  description: string;
  icon: string;
  x: number;
  y: number;
  dangerRating: number;
}

/**
 * Scene 2 — The village council faces two diverging paths: a safe training
 * route and a high-risk ruin expedition. The high-risk POI is highlighted
 * as the chosen hero shot.
 */
export const TrailerChoice: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.choice;
  const choices = useMemo<ChoiceConfig[]>(() => scene.choices as unknown as ChoiceConfig[], [scene.choices]);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (!autoStart) return;
    const highlightTimer = window.setTimeout(() => setHighlightId('ruins'), 4200);
    return () => window.clearTimeout(highlightTimer);
  }, [autoStart]);

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
          top: '8vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <h2
          className="trailer-banner"
          style={{ fontSize: 'clamp(24px, 4vw, 44px)', animationDelay: '0ms' }}
        >
          {scene.title}
        </h2>
        <p className="trailer-subtitle" style={{ animationDelay: '0.6s' }}>
          {scene.subtitle}
        </p>
      </div>

      {choices.map((choice) => {
        const isHighlighted = highlightId === choice.id;
        return (
          <div
            key={choice.id}
            style={{
              position: 'absolute',
              left: `${choice.x}%`,
              top: `${choice.y}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              zIndex: isHighlighted ? 25 : 15,
              opacity: 0,
              animation: 'fadeIn 0.7s ease forwards',
              animationDelay: `${choice.id === 'training' ? 1000 : 1600}ms`,
            }}
          >
            <div style={{ position: 'relative' }}>
              {isHighlighted && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-14px',
                    borderRadius: '50%',
                    border: '2px solid var(--skin-surface-border)',
                    boxShadow: '0 0 24px var(--skin-glow-primary)',
                    animation: 'trailer-pulse-ring 1.4s ease-in-out infinite',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <GenericPoiSkin
                icon={choice.icon}
                size={92}
                dangerRating={choice.dangerRating}
                progress={0.45}
                enableHover={false}
                showRiskBadges={false}
                pillar={choice.type === 'safe' ? 'empire' : 'wilderness'}
              />
            </div>
            <MatericSurface
              shape="card"
              material={choice.type === 'safe' ? 'jade' : 'obsidian'}
              interactive={false}
              style={{
                textAlign: 'center',
                minWidth: '180px',
              }}
            >
              <div
                style={{
                  color: 'var(--trailer-gold-bright, #f0cf6a)',
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 2.2vw, 22px)',
                  letterSpacing: '0.04em',
                }}
              >
                {choice.label}
              </div>
              <div
                style={{
                  color: 'var(--trailer-parchment, #ede0c4)',
                  fontSize: 'clamp(11px, 1.4vw, 14px)',
                  marginTop: '0.25rem',
                  opacity: 0.8,
                }}
              >
                {choice.description}
              </div>
            </MatericSurface>
          </div>
        );
      })}
    </TrailerSceneShell>
  );
};
