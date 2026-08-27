/**
 * WorldSurfaceEventCard — Goblin Invasion announcement shown at the peak of the shroud.
 *
 * Uses the `MatericEventCard` primitive from the design system. After the
 * player confirms, the card shrinks and glides to the top-right of the world,
 * and the goblin with the sticker border falls from above the card and marches
 * to the bottom-right, matching the original shroud event behavior.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { GoblinInvasionWindow } from '@/ui/idleVillage/components/GoblinInvasionWindow';
import { PoiMatericV3 } from '@/ui/idleVillage/components/poi/PoiMatericV3';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

export interface WorldSurfaceEventCardProps {
  /** Whether the card is visible at the peak of the shroud. */
  visible: boolean;
  /** Z-index at which the card sits: above the shroud but below the frame. */
  zIndex: number;
  /** Optional callback when the announcement sequence completes. */
  onComplete?: () => void;
  /** Called when the event card is ready to be unmounted. */
  onClose?: () => void;
  /** World point at the centre of the map where the modal appears. */
  worldCenter: { x: number; y: number };
  /** World canvas size, used to place the final badge in the top-right. */
  canvasSize: { width: number; height: number };
  /** Current world camera, used to keep the goblin a constant screen size. */
  camera: { panX: number; panY: number; zoom: number };
  /** World point where the goblins fall (centre of forest_1_top_left). */
  fallTarget: { x: number; y: number };
  /** World point the goblins slowly march toward after landing. */
  marchTarget: { x: number; y: number };
}

type Stage = 'idle' | 'modal' | 'falling' | 'marching' | 'done';

const DAYS_LEFT = Number(trailerConfig.threat.announcement.timerRing.number) || 5;
const GOBLIN_IMAGE = trailerConfig.threat.goblinImage;
const CARD_HEIGHT = 500;
const CARD_SCALE = 3;

/** Synthetic thud produced when the goblins hit the forest floor. */
const playThud = () => {
  const AudioContext =
    (window as never as { AudioContext?: AudioContext; webkitAudioContext?: AudioContext }).AudioContext ||
    (window as never as { AudioContext?: AudioContext; webkitAudioContext?: AudioContext }).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.7, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
};

export const WorldSurfaceEventCard: React.FC<WorldSurfaceEventCardProps> = ({
  visible,
  zIndex,
  onComplete,
  onClose,
  worldCenter,
  canvasSize,
  camera,
  fallTarget,
  marchTarget,
}) => {
  const { t } = useTranslation('idleVillage');
  const [stage, setStage] = useState<Stage>('idle');
  const [daysLeft] = useState<number>(DAYS_LEFT);

  const goblinSize = useMemo(() => Math.max(600, 400 / camera.zoom), [camera.zoom]);
  const goblinHalf = useMemo(() => goblinSize / 2, [goblinSize]);

  const goblinBase = useMemo(
    () => ({ x: 0, y: -(CARD_HEIGHT * CARD_SCALE) / 2 - goblinHalf }),
    [goblinHalf],
  );

  const fallOffset = useMemo(
    () => ({ x: fallTarget.x - worldCenter.x, y: fallTarget.y - worldCenter.y }),
    [fallTarget, worldCenter],
  );

  const marchOffset = useMemo(
    () => ({ x: marchTarget.x - worldCenter.x, y: marchTarget.y - worldCenter.y }),
    [marchTarget, worldCenter],
  );

  const reminderOffset = useMemo(() => {
    const cellW = canvasSize.width / 3;
    const cellH = canvasSize.height / 3;
    // Center of the 3rd column, 1st row (top-right cell).
    const reminderTarget = { x: cellW * 2.5, y: cellH * 0.5 };
    return {
      x: reminderTarget.x - worldCenter.x,
      y: reminderTarget.y - worldCenter.y,
    };
  }, [canvasSize, worldCenter]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (visible) {
      setStage('modal');
    } else {
      setStage('idle');
    }
  }, [visible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (stage === 'falling') {
      const timer = window.setTimeout(() => setStage('marching'), 1500);
      return () => window.clearTimeout(timer);
    }
    if (stage === 'marching') {
      const timer = window.setTimeout(() => {
        setStage('done');
        onClose?.();
      }, 200500);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [stage, onClose]);

  const handleFallingComplete = useCallback(() => {
    playThud();
  }, []);

  const handleAction = useCallback(() => {
    if (stage !== 'modal') return;
    trackTelemetryEvent('world_surface_event_ack', {
      eventType: 'world_surface_event_ack',
      data: { event: 'goblin_invasion', daysLeft },
      context: 'world-surface-event-card',
      timestamp: Date.now(),
      metadata: {},
    });
    onComplete?.();
    setStage('falling');
  }, [daysLeft, onComplete, stage]);

  if (!visible) {
    return null;
  }

  const isModal = stage === 'modal' || stage === 'falling';

  const goblinAnimate =
    stage === 'falling'
      ? { x: fallOffset.x, y: fallOffset.y, rotate: [0, 0, 0, -12, 12, 0] }
      : stage === 'marching'
        ? { x: marchOffset.x, y: marchOffset.y, rotate: [0, -6, 6, 0] }
        : { x: goblinBase.x, y: goblinBase.y, rotate: 0 };

  const goblinTransition =
    stage === 'falling'
      ? {
          x: { duration: 1.5, ease: 'easeIn' },
          y: { duration: 1.5, ease: 'easeIn' },
          rotate: { duration: 1.5, times: [0, 0.6, 0.8, 0.9, 0.95, 1] },
        }
      : stage === 'marching'
        ? {
            x: { duration: 200, ease: 'linear' },
            y: { duration: 200, ease: 'linear' },
            rotate: { duration: 0.6, times: [0, 0.25, 0.5, 1] },
          }
        : { duration: 0.4 };

  return (
    <div
      style={{
        position: 'absolute',
        left: worldCenter.x,
        top: worldCenter.y,
        zIndex,
      }}
    >
      <motion.div
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={
          isModal
            ? { x: 0, y: 0, scale: 1 }
            : { x: reminderOffset.x, y: reminderOffset.y, scale: 0.35 }
        }
        transition={{
          x: { duration: 1.2, ease: 'easeInOut' },
          y: { duration: 1.2, ease: 'easeInOut' },
          scale: { duration: 1.2, ease: 'easeInOut' },
        }}
        style={{ position: 'relative' }}
      >
        <AnimatePresence>
          <motion.div
            key={isModal ? 'modal' : 'reminder'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            {isModal ? (
              <MatericEventCard
                variant="modal"
                badge={String(t('world.goblinInvasion.invasion'))}
                subtitle={String(t('world.goblinInvasion.subtitle', { count: daysLeft }))}
                image={
                  <div style={{ width: 364, height: 294, overflow: 'hidden', margin: '0 auto' }}>
                    <GoblinInvasionWindow
                      ariaLabel={String(t('world.goblinInvasion.title'))}
                      peeled={stage !== 'modal'}
                      style={{ transform: 'scale(0.7)', transformOrigin: 'top left' }}
                    />
                  </div>
                }
                actionLabel={String(t('world.goblinInvasion.action'))}
                onAction={handleAction}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%) scale(3)',
                  maxWidth: 460,
                  width: 460,
                  minHeight: 500,
                }}
              />
            ) : (
              <MatericEventCard
                variant="reminder"
                title={String(t('world.goblinInvasion.eventLabel'))}
                subtitle={String(t('world.goblinInvasion.invasion'))}
                image={<PoiMatericV3 type="event" state="available" size={64} />}
                daysLeftLabel={String(t('world.goblinInvasion.daysRemaining', { count: daysLeft }))}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%) scale(3)',
                  textAlign: 'left',
                  maxWidth: 320,
                  width: 320,
                  minHeight: 120,
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.img
        initial={{ x: goblinBase.x, y: goblinBase.y }}
        animate={goblinAnimate}
        transition={goblinTransition}
        onAnimationComplete={stage === 'falling' ? handleFallingComplete : undefined}
        src={GOBLIN_IMAGE}
        alt=""
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: goblinSize,
          height: goblinSize,
          marginLeft: -goblinHalf,
          marginTop: -goblinHalf,
          pointerEvents: 'none',
          zIndex: 10,
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6))',
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default WorldSurfaceEventCard;
