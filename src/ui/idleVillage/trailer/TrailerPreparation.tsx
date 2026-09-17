/**
 * @trailer-only
 *
 * TrailerPreparation — Scene 3: Preparation (hero sheet + drag to POI).
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

import React, { useEffect, useState } from 'react';
import { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
import { MatericPortrait, MatericStatBar, MatericInset } from '@/ui/designSystem/primitives';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { TrailerSceneShell } from './TrailerSceneShell';
import type { TrailerSceneProps } from './types';
import './trailer.css';

/**
 * Scene 3 — Hero sheet with Attack/Defense/Magic and a scripted drag of the
 * hero token onto the Forgotten Ruins POI. The POI begins pulsing once the
 * token arrives.
 */
export const TrailerPreparation: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.preparation;
  const hero = scene.hero;
  const poi = scene.poi;
  const [poiActive, setPoiActive] = useState(false);

  useEffect(() => {
    if (!autoStart) return;
    const pulseTimer = window.setTimeout(() => setPoiActive(true), 5800);
    return () => window.clearTimeout(pulseTimer);
  }, [autoStart]);

  useEffect(() => {
    if (!autoStart || !onComplete) return undefined;
    const timer = window.setTimeout(onComplete, scene.duration);
    return () => window.clearTimeout(timer);
  }, [autoStart, onComplete, scene.duration]);

  return (
    <TrailerSceneShell captureMode={captureMode}>
      {/* Hero sheet */}
      <MatericInset
        material="obsidian"
        style={{
          position: 'absolute',
          left: '8vw',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 'min(360px, 34vw)',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          opacity: 0,
          animation: 'fadeIn 0.7s ease forwards',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <MatericPortrait initials={hero.initials} size={72} isHero />
          <div>
            <div
              style={{
                color: 'var(--trailer-gold-bright, #f0cf6a)',
                fontSize: 'clamp(20px, 2.4vw, 26px)',
                fontWeight: 700,
                letterSpacing: '0.03em',
              }}
            >
              {hero.name}
            </div>
            <div
              style={{
                color: 'var(--trailer-parchment, #ede0c4)',
                fontSize: '12px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.75,
                marginTop: '0.25rem',
              }}
            >
              {hero.role}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <MatericStatBar label="Attack" value={hero.attack} maxValue={20} variant="stamina" size="lg" showValue />
          <MatericStatBar label="Defense" value={hero.defense} maxValue={20} variant="hp" size="lg" showValue />
          <MatericStatBar label="Magic" value={hero.magic} maxValue={20} variant="fatigue" size="lg" showValue />
        </div>
      </MatericInset>

      {/* Target POI */}
      <div
        style={{
          position: 'absolute',
          left: `${poi.x}%`,
          top: `${poi.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{ position: 'relative' }}>
          {poiActive && (
            <div
              style={{
                position: 'absolute',
                inset: '-10px',
                borderRadius: '50%',
                border: '2px solid var(--skin-surface-border)',
                boxShadow: '0 0 28px var(--skin-glow-primary)',
                animation: 'trailer-pulse-ring 1.1s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}
          <GenericPoiSkin
            icon={poi.icon}
            label={poi.label}
            size={96}
            dangerRating={poi.dangerRating}
            progress={0.5}
            enableHover={false}
            showRiskBadges={false}
            pillar="wilderness"
          />
        </div>
        <div
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            background: 'rgba(6, 15, 22, 0.8)',
            border: '1px solid var(--trailer-border)',
            color: 'var(--trailer-parchment, #ede0c4)',
            fontSize: '13px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            opacity: 0,
            animation: poiActive ? 'fadeIn 0.5s ease forwards' : undefined,
          }}
        >
          Quest Accepted
        </div>
      </div>

      {/* Animated hero token moving to POI */}
      <div
        style={{
          position: 'absolute',
          zIndex: 25,
          opacity: 0,
          animation: 'trailer-hero-drag 3.5s ease-in-out 1.8s forwards',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '999px',
            background: 'rgba(6, 15, 22, 0.92)',
            border: '1px solid var(--trailer-border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <MatericPortrait initials={hero.initials} size={36} isHero />
          <span
            style={{
              color: 'var(--trailer-gold-bright, #f0cf6a)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {hero.name}
          </span>
        </div>
      </div>
    </TrailerSceneShell>
  );
};
