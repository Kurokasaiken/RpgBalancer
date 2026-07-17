/**
 * @trailer-only
 *
 * TrailerConsequence — Scene 5: Consequence (village lost + greyscale).
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
import { V9GlassLayers } from '@/ui/v9-skin/V9GlassLayers';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { TeaserImpactOverlay } from './TeaserImpactOverlay';
import type { TrailerSceneProps } from './types';
import './trailer.css';

interface ConsequenceNotification {
  id: string;
  icon: string;
  message: string;
  delay: number;
}

/**
 * Scene 5 — The village timer runs down, greyscale takes over, and the
 * impact overlay confirms the settlement is lost.
 */
export const TrailerConsequence: React.FC<TrailerSceneProps> = ({
  onComplete,
  autoStart = true,
  captureMode = false,
}) => {
  const scene = trailerConfig.consequence;
  const [timer, setTimer] = useState<number>(scene.timerStart);
  const [showLost, setShowLost] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [notifications, setNotifications] = useState<ConsequenceNotification[]>([]);

  const allNotifications = useMemo<ConsequenceNotification[]>(() => scene.notifications as unknown as ConsequenceNotification[], [scene.notifications]);

  useEffect(() => {
    if (!autoStart) return;

    const interval = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    const timers: number[] = [];
    allNotifications.forEach((n) => {
      timers.push(
        window.setTimeout(() => {
          setNotifications((prev) => [...prev, n]);
        }, n.delay)
      );
    });

    const lostTimer = window.setTimeout(() => {
      setShowLost(true);
      setShowImpact(true);
    }, scene.timerStart * 1000);

    return () => {
      window.clearInterval(interval);
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(lostTimer);
    };
  }, [autoStart, allNotifications, scene.timerStart]);

  useEffect(() => {
    if (!autoStart || !onComplete) return undefined;
    const timerRef = window.setTimeout(onComplete, scene.duration);
    return () => window.clearTimeout(timerRef);
  }, [autoStart, onComplete, scene.duration]);

  return (
    <div
      className={`trailer-root trailer-background ${showLost ? 'trailer-greyscale' : ''} ${
        captureMode ? 'trailer-capture-mode' : ''
      }`}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        transition: 'filter 1.2s ease',
      }}
    >
      <V9GlassLayers
        variant="sapphire"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.75,
          fontFamily: 'inherit',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '18vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(24px, 4vw, 40px)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: showLost ? 'rgba(239, 68, 68, 0.95)' : 'var(--trailer-gold, #d8b13e)',
            fontWeight: 700,
            textShadow: showLost
              ? '0 0 24px rgba(239, 68, 68, 0.55)'
              : '0 0 16px rgba(216, 177, 62, 0.35)',
            transition: 'all 0.8s ease',
          }}
        >
          {showLost ? scene.message : `Invasion in ${Math.max(0, timer)}`}
        </div>
        {showLost && (
          <div
            style={{
              marginTop: '0.75rem',
              color: 'var(--trailer-parchment, #ede0c4)',
              fontSize: 'clamp(14px, 2vw, 20px)',
              letterSpacing: '0.06em',
              opacity: 0,
              animation: 'fadeIn 0.8s ease 0.3s forwards',
            }}
          >
            {scene.subMessage}
          </div>
        )}
      </div>

      {/* Notification stack */}
      <div
        style={{
          position: 'absolute',
          top: '38vh',
          right: '6vw',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          zIndex: 20,
          pointerEvents: 'none',
          maxWidth: '320px',
        }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(20, 10, 10, 0.88)',
              border: '1px solid rgba(248,113,113,0.4)',
              color: 'var(--trailer-parchment, #ede0c4)',
              fontSize: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              animation: 'trailer-notification-in 0.5s ease forwards',
            }}
          >
            <span style={{ fontSize: '18px' }}>{n.icon}</span>
            <span style={{ fontWeight: 600, letterSpacing: '0.03em' }}>{n.message}</span>
          </div>
        ))}
      </div>

      <TeaserImpactOverlay visible={showImpact} intensity={showLost ? 1 : 0} />
    </div>
  );
};
