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
 * Scene 1 — Hearthstone-style goblin invasion announcement (3 seconds).
 *
 * Phases:
 *   1. announcement (0-3000ms): full map visible, dark vignette appears,
 *      war horn, dust cloud, floating goblin sticker, title, subtitle,
 *      bronze ring timer showing "5 DAYS REMAIN".
 *   2. timer (3000ms+): announcement collapses to persistent top-bar countdown.
 */
export const TrailerThreatIter: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.threat;
  const announcement = scene.announcement;
  const pois = useMemo<ThreatPoiConfig[]>(() => scene.pois as unknown as ThreatPoiConfig[], [scene.pois]);

  const [phase, setPhase] = useState<'announcement' | 'timer'>('announcement');
  const [timeRemaining, setTimeRemaining] = useState(5 * 3600 + 47 * 60 + 12);

  useEffect(() => {
    if (!autoStart) return undefined;
    const announcementTimer = window.setTimeout(() => setPhase('timer'), announcement.duration);
    return () => window.clearTimeout(announcementTimer);
  }, [autoStart, announcement.duration]);

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

  useEffect(() => {
    if (!autoStart || phase !== 'announcement') return undefined;
    const audio = new Audio(encodeURI(announcement.warHorn));
    audio.volume = 0.6;
    audio.play().catch(() => {
      // Placeholder audio is allowed to fail silently.
    });
    return undefined;
  }, [autoStart, phase, announcement.warHorn]);

  return (
    <div className={`tti-root ${captureMode ? 'tti-capture-mode' : ''}`}>
      <style>{ttiStyles}</style>

      <div
        className="tti-map"
        style={{ backgroundImage: `url(${encodeURI(scene.mapImage)})` }}
      />
      <div
        className="tti-vignette"
        style={{ opacity: phase === 'announcement' ? announcement.vignetteOpacity : 0 }}
      />
      <div
        className="tti-dim"
        style={{ opacity: phase === 'announcement' ? announcement.dimOpacity : 0 }}
      />

      {phase === 'announcement' && (
        <div
          className="tti-dust-cloud"
          style={{
            width: announcement.dustCloud.width,
            opacity: announcement.dustCloud.opacity,
            animationDuration: `${announcement.dustCloud.duration}ms`,
            animationDelay: `${announcement.dustCloud.delay}ms`,
          }}
        />
      )}

      <div
        className="tti-ui"
        style={{ filter: phase === 'announcement' ? announcement.dimFilter : 'none' }}
      >
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

        {phase === 'timer' && (
          <div className="tti-panel tti-panel--timer">
            <TrailerThreatDetailPanel
              title={scene.eventTitle}
              plaque={scene.eventPlaque}
              timeRemaining={timeRemaining}
              poiIcon="⚔️"
              mode="timer"
            />
          </div>
        )}
      </div>

      {phase === 'announcement' && (
        <div className="tti-announcement">
          <div
            className="tti-sticker"
            style={{
              width: announcement.sticker.width,
              filter: `drop-shadow(${announcement.sticker.glow})`,
              animationDuration: `${announcement.sticker.bobDuration}ms`,
            }}
          >
            <img src={encodeURI(scene.goblinImage)} alt="" />
          </div>

          <div className="tti-ring-wrap">
            <div
              className="tti-ring"
              style={{
                width: announcement.timerRing.size,
                height: announcement.timerRing.size,
                animationDuration: `${announcement.timerRing.rotationDuration}ms`,
              }}
            >
              <span className="tti-ring__number">{announcement.timerRing.number}</span>
            </div>
            <span className="tti-ring__days">{announcement.timerRing.daysText}</span>
          </div>

          <h1 className="tti-title">{announcement.title}</h1>
          <p className="tti-subtitle">{announcement.subtitle}</p>
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
    filter: brightness(1) saturate(1) contrast(1);
    opacity: 1;
    transition: filter 0.8s ease;
  }

  .tti-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, rgba(2, 5, 8, 0.72) 80%, rgba(1, 2, 4, 0.92) 100%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 10;
  }

  .tti-dim {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 11;
  }

  .tti-dust-cloud {
    position: absolute;
    top: 52%;
    left: 110vw;
    height: 22vh;
    background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(160, 140, 120, 0.32) 0%, rgba(120, 100, 80, 0.18) 40%, transparent 75%);
    filter: blur(20px);
    pointer-events: none;
    animation: tti-dust-move linear forwards;
    z-index: 12;
  }

  .tti-ui {
    position: absolute;
    inset: 0;
    transition: filter 0.4s ease;
    z-index: 5;
  }

  .tti-poi {
    position: absolute;
    z-index: 5;
    opacity: 0;
    animation: tti-fade-in 0.7s ease forwards;
  }

  .tti-panel {
    position: absolute;
    z-index: 20;
    pointer-events: none;
    transition: top 0.7s ease, left 0.7s ease, transform 0.7s ease, opacity 0.7s ease;
    animation: tti-fade-in 0.6s ease forwards;
    width: 320px;
  }

  .tti-panel--timer {
    top: 24px;
    right: 24px;
    left: auto;
    transform: translate(0, 0);
  }

  .tti-announcement {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 30;
    pointer-events: none;
    animation: tti-fade-in 0.5s ease forwards;
  }

  .tti-sticker {
    position: relative;
    z-index: 31;
    animation: tti-sticker-float ease-in-out infinite;
  }

  .tti-sticker img {
    width: 100%;
    height: auto;
    display: block;
    filter: drop-shadow(0 8px 24px rgba(0,0,0,0.65));
  }

  .tti-ring-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-top: 18px;
    z-index: 31;
  }

  .tti-ring {
    position: relative;
    border-radius: 50%;
    border: 3px solid rgba(201, 162, 39, 0.25);
    border-top-color: #c9a227;
    box-shadow: 0 0 18px rgba(201, 162, 39, 0.25), inset 0 0 12px rgba(201, 162, 39, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: tti-ring-spin linear infinite;
  }

  .tti-ring__number {
    font-family: var(--skin-font-display, 'Cinzel', Georgia, serif);
    font-size: 2rem;
    font-weight: 900;
    color: #c9a227;
    text-shadow: 0 2px 6px rgba(0,0,0,0.85);
  }

  .tti-ring__days {
    font-family: var(--skin-font-sans, 'Lato', sans-serif);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--skin-text-primary, #f0efe4);
    text-shadow: 0 1px 3px rgba(0,0,0,0.85);
  }

  .tti-title {
    margin: 18px 0 0;
    font-family: var(--skin-font-display, 'Cinzel', Georgia, serif);
    font-size: clamp(2rem, 5.5vw, 4.2rem);
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--skin-title-color, #f0efe4);
    text-shadow: 0 3px 8px rgba(0,0,0,0.9);
    text-align: center;
  }

  .tti-subtitle {
    margin: 8px 0 0;
    font-family: var(--skin-font-display, 'Cinzel', Georgia, serif);
    font-size: clamp(0.8rem, 1.8vw, 1.1rem);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--skin-subtitle-color, #b8b5a6);
    text-shadow: 0 2px 6px rgba(0,0,0,0.85);
    text-align: center;
  }

  .tti-capture-mode .tti-debug {
    display: none !important;
  }

  @keyframes tti-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes tti-sticker-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }

  @keyframes tti-ring-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes tti-dust-move {
    from { transform: translateX(0); }
    to { transform: translateX(-220vw); }
  }
`;

export default TrailerThreatIter;
