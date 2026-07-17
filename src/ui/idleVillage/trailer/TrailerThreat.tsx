/**
 * @trailer-only
 *
 * TrailerThreat — Scene 1: Threat (map + POI appear + GOBLIN INVASION banner).
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
import { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
import { WanderlustSurface } from '@/ui/wanderlust-surface/WanderlustSurface';
import { V9GlassLayers } from '@/ui/v9-skin/V9GlassLayers';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import type { TrailerSceneProps } from './types';
import './trailer.css';

type ThreatPoiStatus = 'available' | 'in_progress' | 'completed' | 'failed';

interface ThreatPoiConfig {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  delay: number;
  dangerRating: number;
  status: ThreatPoiStatus;
}

/**
 * Scene 1 — GOBLIN INVASION banner and three frontier POI markers appearing
 * on the map.
 *
 * Runs for `trailerConfig.threat.duration` ms then calls `onComplete`.
 */
export const TrailerThreat: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.threat;
  const pois = useMemo<ThreatPoiConfig[]>(() => scene.pois as unknown as ThreatPoiConfig[], [scene.pois]);

  useEffect(() => {
    if (!autoStart || !onComplete) return undefined;
    const timer = window.setTimeout(onComplete, scene.duration);
    return () => window.clearTimeout(timer);
  }, [autoStart, onComplete, scene.duration]);

  return (
    <div
      className={`trailer-root trailer-background ${captureMode ? 'trailer-capture-mode' : ''}`}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <WanderlustSurface
        shape="panel"
        material="bronze"
        interactive={false}
        className="trailer-ws-fullbleed"
        style={{ position: 'absolute', inset: 0 }}
      >
        <V9GlassLayers
          variant="base"
          style={{
            position: 'absolute',
            inset: 0,
            fontFamily: 'inherit',
          }}
        >
          {/* Decorative map grid */}
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <defs>
              <pattern id="trailer-threat-grid" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M 120 0 L 0 0 0 120" fill="none" stroke="var(--trailer-gold, #d8b13e)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#trailer-threat-grid)" />
          </svg>

          {/* Banner */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <h1 className="trailer-banner" style={{ textAlign: 'center', animationDelay: '200ms' }}>
              {scene.banner}
            </h1>
            <p
              style={{
                marginTop: '0.75rem',
                color: 'var(--trailer-parchment, #ede0c4)',
                fontSize: 'clamp(14px, 2vw, 20px)',
                letterSpacing: '0.12em',
                opacity: 0,
                textTransform: 'uppercase',
                animation: 'fadeIn 0.8s ease 0.8s forwards',
              }}
            >
              {scene.subBanner}
            </p>
          </div>

          {/* POI markers */}
          {pois.map((poi) => (
            <div
              key={poi.id}
              style={{
                position: 'absolute',
                left: `${poi.x}%`,
                top: `${poi.y}%`,
                transform: 'translate(-50%, -50%)',
                opacity: 0,
                animation: 'fadeIn 0.6s ease forwards',
                animationDelay: `${poi.delay}ms`,
                zIndex: 20,
              }}
            >
              <GenericPoiSkin
                icon={poi.icon}
                label={poi.label}
                size={72}
                dangerRating={poi.dangerRating}
                progress={0.35}
                enableHover={false}
                showRiskBadges={false}
                pillar="frontier"
              />
            </div>
          ))}
        </V9GlassLayers>
      </WanderlustSurface>
    </div>
  );
};
