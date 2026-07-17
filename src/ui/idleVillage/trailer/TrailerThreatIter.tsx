/**
 * @trailer-only
 *
 * TrailerThreatIter — Scene 1 iteration: goblin invasion event + persistent timer.
 *
 * Prototype for the Steam teaser trailer. Rewritten to reuse the POI kit,
 * the VFL teal/obsidian foundation, and a reduced POI-detail fork panel.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 */

import React, { useEffect, useMemo, useState } from 'react';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { GenericPoiSkin } from '@/ui/idleVillage/frozen/kits/poiKit';
import { TrailerThreatDetailPanel } from './TrailerThreatDetailPanel';
import type { TrailerSceneProps } from './types';

const EVENT_DELAY_MS = 600;
const TIMER_DELAY_MS = 2800;
const TIMER_UPDATE_MS = 1000;

/**
 * Props describing a single threat POI on the map.
 */
export interface ThreatPoiConfig {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  delay: number;
  dangerRating: number;
  status: string;
}

/**
 * Scene 1 iteration — goblin invasion event becomes a persistent on-screen timer.
 *
 * Phases:
 *   1. intro: map + POIs fade in
 *   2. event: centered "GOBLIN INVASION" plaque
 *   3. timer: plaque collapses to a persistent top-bar countdown
 */
export const TrailerThreatIter: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.threat;
  const pois = useMemo<ThreatPoiConfig[]>(() => scene.pois as unknown as ThreatPoiConfig[], [scene.pois]);

  const [phase, setPhase] = useState<'intro' | 'event' | 'timer'>('intro');
  const [timeRemaining, setTimeRemaining] = useState(5 * 3600 + 47 * 60 + 12);

  useEffect(() => {
    if (!autoStart) return undefined;
    const eventTimer = window.setTimeout(() => setPhase('event'), EVENT_DELAY_MS);
    const timerTimer = window.setTimeout(() => setPhase('timer'), TIMER_DELAY_MS);
    return () => {
      window.clearTimeout(eventTimer);
      window.clearTimeout(timerTimer);
    };
  }, [autoStart]);

  useEffect(() => {
    if (phase !== 'timer') return undefined;
    const interval = window.setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, TIMER_UPDATE_MS);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (!autoStart || !onComplete) return undefined;
    const timer = window.setTimeout(onComplete, scene.duration);
    return () => window.clearTimeout(timer);
  }, [autoStart, onComplete, scene.duration]);

  return (
    <div className={`tti-root ${captureMode ? 'tti-capture-mode' : ''}`}>
      <style>{ttiStyles}</style>

      <div className="tti-map" style={{ backgroundImage: `url(${scene.mapImage})` }} />
      <div className="tti-vignette" />

      {pois.map((poi) => (
        <div
          key={poi.id}
          className="tti-poi"
          style={{
            position: 'absolute',
            left: `${poi.x}%`,
            top: `${poi.y}%`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${poi.delay}ms`,
          }}
        >
          <GenericPoiSkin
            icon={poi.icon}
            label={poi.label}
            progress={0.35}
            size={72}
            pillar="wilderness"
            enableHover={false}
            dangerRating={poi.dangerRating}
            showRiskBadges={false}
          />
        </div>
      ))}

      {(phase === 'event' || phase === 'timer') && (
        <div className={phase === 'event' ? 'tti-event-card' : 'tti-timer-bar'}>
          <TrailerThreatDetailPanel
            title={scene.eventTitle}
            subtitle={phase === 'event' ? scene.subBanner : undefined}
            plaque={scene.eventPlaque}
            timeRemaining={timeRemaining}
            poiIcon="⚔️"
            mode={phase === 'event' ? 'event' : 'timer'}
          />
        </div>
      )}
    </div>
  );
};

const ttiStyles = `
  .tti-root {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    font-family: var(--skin-font-display, 'Cinzel', Georgia, serif);
    color: var(--skin-text-primary, #f0efe4);
    background: #060f16;
  }

  .tti-map {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.42) saturate(1.15) contrast(1.08);
    opacity: 0;
    animation: tti-fade-in 0.8s ease forwards;
  }

  .tti-azure {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 0% 0%, rgba(0, 229, 255, 0.18) 0%, transparent 42%),
      radial-gradient(circle at 100% 80%, rgba(201, 162, 39, 0.06) 0%, transparent 35%);
    mix-blend-mode: screen;
    pointer-events: none;
  }

  .tti-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, rgba(2, 5, 8, 0.72) 80%, rgba(1, 2, 4, 0.92) 100%);
    pointer-events: none;
  }

  .tti-poi {
    position: absolute;
    z-index: 5;
    opacity: 0;
    animation: tti-fade-in 0.7s ease forwards;
  }

  .tti-event-card {
    position: absolute;
    right: 4vw;
    bottom: 6vh;
    z-index: 10;
    transform: scale(0.9);
    transform-origin: bottom right;
    pointer-events: none;
    animation: tti-fade-in 0.5s ease forwards;
  }

  .tti-timer-bar {
    position: absolute;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    animation: tti-slide-down 0.5s ease forwards;
    filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.55));
  }

  .tti-capture-mode .tti-debug {
    display: none !important;
  }

  @keyframes tti-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes tti-scale-in {
    from { transform: scale(0.96); }
    to { transform: scale(1); }
  }

  @keyframes tti-slide-down {
    from { opacity: 0; transform: translate(-50%, -20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`;

export default TrailerThreatIter;
