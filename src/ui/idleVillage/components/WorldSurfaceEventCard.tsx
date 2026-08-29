/**
 * WorldSurfaceEventCard — Goblin Invasion announcement shown at the peak of the shroud.
 *
 * The card appears reduced by 33% and shows only the "Invasion" badge plus
 * a clickable POI. After the player confirms, the sticker detaches and the
 * card shrinks into a narrow, tall reminder parked in the top-right of the world.
 *
 * Sequence, after the player confirms:
 *  1. `peeling`  — the bordered goblin sticker begins to detach;
 *  2. `falling`  — the sticker lands on the centre of `forest_1_top_left` (thud);
 *  3. `marching` — it crawls very slowly toward the village.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { GoblinInvasionWindow } from '@/ui/idleVillage/components/GoblinInvasionWindow';
import { PoiMatericV3 } from '@/ui/idleVillage/components/poi/PoiMatericV3';
import goblinStickerImage from '@/assets/ui/idleVillage/goblin-march-trasparente.png';
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
  /** World canvas size, used to place the final reminder in the top-right. */
  canvasSize: { width: number; height: number };
  /** Current world camera, used to keep the card grounded in the world. */
  camera: { panX: number; panY: number; zoom: number };
  /** World point where the goblin sticker lands (centre of forest_1_top_left). */
  fallTarget: { x: number; y: number };
  /** World point the goblin slowly marches toward (the village). */
  marchTarget: { x: number; y: number };
}

type Stage = 'idle' | 'modal' | 'peeling' | 'falling' | 'marching' | 'done';

const DAYS_LEFT = Number(trailerConfig.threat.announcement.timerRing.number) || 5;

/**
 * World-pixel scale of the announcement card. The map canvas is 4240×2828, so
 * the card is authored at its design size (460px wide) and blown up here.
 * Reduced by 33% from the original modal size so it appears at this scale
 * from the moment the shroud shows it.
 */
const CARD_SCALE = 6 * 0.75;
/** The reminder is a narrow, tall pgCard-shaped chip, so it needs less scale. */
const REMINDER_SCALE = 3.4 * 0.75;

const CARD_W = 460;
/** Viewport that crops the glass case inside the card (from /primitives). */
const WINDOW_BOX_W = 364;
const WINDOW_BOX_H = 294;
const WINDOW_INNER_SCALE = 0.7;

/** pgCard proportions (172×260 in the roster) for the parked reminder. */
const REMINDER_W = 180;
const REMINDER_H = 268;

/** Natural size of the sticker sprite once detached from the card. */
const STICKER_W = 476;
const STICKER_H = 376;
/** Apparent scale of the sticker while it still sits inside the card. */
const STICKER_CARD_SCALE = CARD_SCALE * WINDOW_INNER_SCALE;
/** Apparent scale once it has landed on the forest and marches on the map. */
const STICKER_MAP_SCALE = 1.6;
/** Where the glass case sits inside the card, in card-local pixels. */
const STICKER_START_Y = 30;

const PEEL_MS = 900;
const FALL_MS = 1600;
const MARCH_DURATION_MS = trailerConfig.threat.goblin.marchDurationMs;

/** Synthetic thud produced when the goblin hits the forest floor. */
const playThud = () => {
  const AudioContextCtor =
    (window as never as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
    (window as never as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  const ctx = new AudioContextCtor();
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

/**
 * POI that starts with an empty magic circle and fills counter-clockwise.
 */
const FillingPoi: React.FC<{ size: number }> = ({ size }) => {
  const [progress, setProgress] = useState(0);
  const duration = trailerConfig.threat.goblin.poiFillDurationMs;

  useEffect(() => {
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <PoiMatericV3
      type="event"
      state="active"
      progress={progress}
      timerDirection="counterclockwise"
      size={size}
    />
  );
};

export const WorldSurfaceEventCard: React.FC<WorldSurfaceEventCardProps> = ({
  visible,
  zIndex,
  onComplete,
  onClose,
  worldCenter,
  canvasSize,
  fallTarget,
  marchTarget,
}) => {
  const { t } = useTranslation('idleVillage');
  const [stage, setStage] = useState<Stage>('modal');
  const [daysLeft] = useState<number>(DAYS_LEFT);

  const fallOffset = useMemo(
    () => ({ x: fallTarget.x - worldCenter.x, y: fallTarget.y - worldCenter.y }),
    [fallTarget, worldCenter],
  );

  const marchOffset = useMemo(
    () => ({ x: marchTarget.x - worldCenter.x, y: marchTarget.y - worldCenter.y }),
    [marchTarget, worldCenter],
  );

  /**
   * Parked position of the reminder: top-right of the map, pulled inside the
   * carved frame so the card is not clipped by it.
   */
  const reminderOffset = useMemo(() => ({
    x: canvasSize.width * 0.8 - worldCenter.x,
    y: canvasSize.height * 0.26 - worldCenter.y,
  }), [canvasSize, worldCenter]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStage(visible ? 'modal' : 'idle');
  }, [visible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (stage === 'peeling') {
      const timer = window.setTimeout(() => setStage('falling'), PEEL_MS);
      return () => window.clearTimeout(timer);
    }
    if (stage === 'falling') {
      const timer = window.setTimeout(() => {
        playThud();
        setStage('marching');
      }, FALL_MS);
      return () => window.clearTimeout(timer);
    }
    if (stage === 'marching') {
      const timer = window.setTimeout(() => {
        setStage('done');
        onClose?.();
      }, MARCH_DURATION_MS + 500);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [stage, onClose]);

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
    setStage('peeling');
  }, [daysLeft, onComplete, stage]);

  if (!visible || stage === 'idle') {
    return null;
  }

  /** The card keeps its modal shape while the sticker is still attached. */
  const isModal = stage === 'modal' || stage === 'peeling';
  const stickerDetached = stage === 'falling' || stage === 'marching' || stage === 'done';

  const stickerAnimate = stage === 'falling'
    ? { x: fallOffset.x, y: fallOffset.y, scale: STICKER_MAP_SCALE }
    : { x: marchOffset.x, y: marchOffset.y, scale: STICKER_MAP_SCALE };

  const stickerTransition = stage === 'falling'
    ? {
        x: { duration: FALL_MS / 1000, ease: 'easeIn' as const },
        y: { duration: FALL_MS / 1000, ease: 'easeIn' as const },
        scale: { duration: FALL_MS / 1000, ease: 'easeOut' as const },
      }
    : {
        x: { duration: MARCH_DURATION_MS / 1000, ease: 'linear' as const },
        y: { duration: MARCH_DURATION_MS / 1000, ease: 'linear' as const },
        scale: { duration: 0.4 },
      };

  return (
    <div
      style={{
        position: 'absolute',
        left: worldCenter.x,
        top: worldCenter.y,
        width: 0,
        height: 0,
        zIndex,
      }}
    >
      {/* Card: modal in the middle of the map, then a small reminder top-right. */}
      <motion.div
        initial={{ x: 0, y: 0, scale: CARD_SCALE }}
        animate={
          isModal
            ? { x: 0, y: 0, scale: CARD_SCALE }
            : { x: reminderOffset.x, y: reminderOffset.y, scale: REMINDER_SCALE }
        }
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}
      >
        <AnimatePresence mode="wait">
          {isModal ? (
            <motion.div
              key="modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: CARD_W,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <MatericEventCard
                variant="modal"
                badge={String(t('world.goblinInvasion.invasion'))}
                subtitle={String(t('world.goblinInvasion.subtitle', { count: daysLeft }))}
                image={
                  <div
                    style={{
                      position: 'relative',
                      width: WINDOW_BOX_W,
                      height: WINDOW_BOX_H,
                      overflow: 'hidden',
                      margin: '0 auto',
                    }}
                  >
                    <GoblinInvasionWindow
                      ariaLabel={String(t('world.goblinInvasion.title'))}
                      peeled={stage === 'peeling'}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) scale(${WINDOW_INNER_SCALE})`,
                      }}
                    />
                  </div>
                }
                actionLabel={String(t('world.goblinInvasion.action'))}
                onAction={handleAction}
                style={{ maxWidth: CARD_W, width: CARD_W }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="reminder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: REMINDER_W,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <MatericEventCard
                variant="modal"
                title={String(t('world.goblinInvasion.invasion'))}
                image={
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <FillingPoi size={80} />
                  </div>
                }
                style={{
                  maxWidth: REMINDER_W,
                  width: REMINDER_W,
                  minHeight: REMINDER_H,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* The bordered goblin sticker, once torn off the card. */}
      {stickerDetached && (
        <motion.div
          initial={{ x: 0, y: STICKER_START_Y * CARD_SCALE, scale: STICKER_CARD_SCALE }}
          animate={stickerAnimate}
          transition={stickerTransition}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: STICKER_W,
            height: STICKER_H,
            marginLeft: -STICKER_W / 2,
            marginTop: -STICKER_H / 2,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <img
            src={goblinStickerImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.55))',
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default WorldSurfaceEventCard;
