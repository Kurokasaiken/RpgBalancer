/**
 * WorldSurfaceEventCard — Goblin Invasion announcement shown at the peak of the shroud.
 *
 * Replaces the placeholder trailer card with an i18n/config-driven flow:
 * cloud reveal → centered announcement → split into a map sticker and a
 * persistent top-right event widget.
 */

import React, { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { WanderlustSurface } from '@/ui/wanderlust-surface';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';
import { SkinScope, SkinTitle, SkinBadge, SkinButton } from '@/ui/idleVillage/skins/primitives';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import '@/ui/idleVillage/trailer/trailer.css';

export interface WorldSurfaceEventCardProps {
  /** Whether the card is visible at the peak of the shroud. */
  visible: boolean;
  /** Z-index at which the card sits: above the shroud but below the frame. */
  zIndex: number;
  /** Optional callback when the announcement sequence completes. */
  onComplete?: () => void;
  /** Called when the event card is ready to be unmounted. */
  onClose?: () => void;
  /** World point where the goblins fall (centre of forest_1_top_left). */
  fallTarget: { x: number; y: number };
  /** World point the goblins slowly march toward after landing. */
  marchTarget: { x: number; y: number };
  /** World point at the centre of the map where the modal appears. */
  worldCenter: { x: number; y: number };
  /** World canvas size, used to pin the final badge in the top-right. */
  canvasSize: { width: number; height: number };
  /** Current world camera, used to keep the card correctly centered at any zoom. */
  camera: { panX: number; panY: number; zoom: number };
}

type Stage = 'idle' | 'clouds' | 'modal' | 'falling' | 'marching' | 'done';

const GOBLIN_IMAGE = trailerConfig.threat.goblinImage;
const WAR_HORN = trailerConfig.threat.announcement.warHorn;
const DAYS_LEFT = Number(trailerConfig.threat.announcement.timerRing.number) || 5;

/** Distant war horn or fallback thud when the parchment card lands. */
const playHorn = () => {
  const audio = new Audio(WAR_HORN);
  audio.volume = 0.6;
  audio.play().catch(() => playThud());
};

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

/**
 * Renders the goblin-invasion event announcement at the centre of the map.
 *
 * The flow is driven by the `visible` prop: clouds roll in, the modal fades up,
 * the player confirms, and the card splits into a map sticker and the
 * top-right event badge.
 */
export const WorldSurfaceEventCard: React.FC<WorldSurfaceEventCardProps> = ({
  visible,
  zIndex,
  onComplete,
  onClose,
  fallTarget,
  marchTarget,
  worldCenter,
  canvasSize,
  camera,
}) => {
  const { t } = useTranslation('idleVillage');
  const [stage, setStage] = useState<Stage>('idle');
  const [daysLeft] = useState<number>(DAYS_LEFT);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasHornedRef = useRef(false);
  const [contentSize, setContentSize] = useState({ width: 1200, height: 600 });

  const fallOffset = useMemo(
    () => ({
      x: fallTarget.x - worldCenter.x,
      y: fallTarget.y - worldCenter.y,
    }),
    [fallTarget, worldCenter],
  );

  const marchOffset = useMemo(
    () => ({
      x: marchTarget.x - worldCenter.x,
      y: marchTarget.y - worldCenter.y,
    }),
    [marchTarget, worldCenter],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!visible) {
      setStage('idle');
      hasHornedRef.current = false;
      return undefined;
    }
    setStage('clouds');
    return undefined;
  }, [visible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (stage === 'modal' && !hasHornedRef.current) {
      hasHornedRef.current = true;
      playHorn();
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'clouds') {
      const t = window.setTimeout(() => setStage('modal'), 1200);
      return () => window.clearTimeout(t);
    }
    if (stage === 'marching') {
      const t = window.setTimeout(() => {
        setStage('done');
        onClose?.();
      }, 200500);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [stage, onClose]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setContentSize({
      width: el.clientWidth,
      height: el.clientHeight,
    });
  }, [stage, visible, canvasSize, camera.zoom]);

  const baseOffset = useMemo(
    () => ({ x: -contentSize.width / 2, y: -contentSize.height / 2 }),
    [contentSize],
  );

  // Keep the goblin a constant, large screen size regardless of world zoom.
  const goblinSize = useMemo(() => Math.max(600, 400 / camera.zoom), [camera.zoom]);
  const goblinHalf = useMemo(() => goblinSize / 2, [goblinSize]);

  const goblinBase = useMemo(
    () => ({
      x: 0,
      // Place the goblin entirely above the panel, its bottom edge touching the panel top.
      y: -contentSize.height / 2 - goblinHalf,
    }),
    [contentSize, goblinHalf],
  );

  const reminderTarget = useMemo(() => {
    const cellW = canvasSize.width / 3;
    const cellH = canvasSize.height / 3;
    // Center of the 3rd column, 1st row (top-right cell).
    return { x: cellW * 2.5, y: cellH * 0.5 };
  }, [canvasSize]);

  const handleFallingComplete = useCallback(() => {
    playThud();
    setStage('marching');
  }, []);

  const handleConfirm = useCallback(() => {
    trackTelemetryEvent('world_surface_event_ack', {
      eventType: 'world_surface_event_ack',
      data: { event: 'goblin_invasion', daysLeft },
      context: 'world-surface-event-card',
      timestamp: Date.now(),
      metadata: {},
    });
    onComplete?.();
    // Start the goblin fall immediately once the shroud is no longer visible.
    setStage('falling');
  }, [daysLeft, onComplete]);

  const modalOpacity = stage === 'modal' || stage === 'falling' || stage === 'marching' ? 1 : 0;
  const isReminder = stage === 'marching' || stage === 'done';

  const panelTarget = isReminder ? reminderTarget : worldCenter;
  const panelAnimate = {
    x: panelTarget.x - worldCenter.x + baseOffset.x,
    y: panelTarget.y - worldCenter.y + baseOffset.y,
    scale: isReminder ? 0.35 : 1,
  };

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
      className={`ws-event-card ${visible ? 'ws-event-card--visible' : ''}`}
      style={{
        position: 'absolute',
        left: worldCenter.x,
        top: worldCenter.y,
        zIndex,
      }}
      aria-hidden={!visible}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: baseOffset.x, y: baseOffset.y }}
        animate={{ opacity: modalOpacity, scale: panelAnimate.scale, x: panelAnimate.x, y: panelAnimate.y }}
        transition={{
          opacity: { duration: 0.6, ease: 'easeOut' },
          scale: { duration: 0.6, ease: 'easeOut' },
          x: { duration: 1.2, ease: 'easeInOut' },
          y: { duration: 1.2, ease: 'easeInOut' },
        }}
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <div
          ref={contentRef}
          className="ws-event-card__content"
          style={{
            position: 'relative',
            width: 1200,
            zIndex: 2,
            opacity: modalOpacity,
            transition:
              'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: stage === 'modal' ? 'auto' : 'none',
          }}
        >
          <WanderlustSurface
            shape="panel"
            material="bronze"
            interactive={false}
            className="trailer-ws-fullbleed"
            style={{ width: '100%' }}
          >
            <WanderlustAmbientField fireflyCount={0} style={{ borderRadius: 'inherit' }}>
              <SkinScope style={{ padding: '28px 30px 30px', textAlign: 'center' }}>
                {isReminder ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <img src={GOBLIN_IMAGE} alt="" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--skin-title-color)' }}>
                      {String(t('world.goblinInvasion.eventLabel' as never))}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--skin-status-wound)' }}>
                      {String(t('world.goblinInvasion.daysRemaining' as never, { count: daysLeft }))}
                    </div>
                  </div>
                ) : (
                  <>
                    <SkinBadge style={{ display: 'inline-block', marginBottom: 8 }}>
                      {String(t('threatStatus.type.GOBLIN_RAID' as never))}
                    </SkinBadge>
                    <SkinTitle level="1">
                      {String(t('world.goblinInvasion.title' as never))}
                    </SkinTitle>
                    <SkinTitle level="subtitle">
                      {String(t('world.goblinInvasion.subtitle' as never, { count: daysLeft }))}
                    </SkinTitle>

                    <div style={{ width: '56%', height: 'auto', margin: '18px auto 0' }}>
                      <div style={{ width: '100%', height: '160px' }} />
                    </div>

                    <SkinButton
                      variant="cta"
                      onClick={handleConfirm}
                      style={{ marginTop: 20 }}
                    >
                      {String(t('world.goblinInvasion.action' as never))}
                    </SkinButton>
                  </>
                )}
              </SkinScope>
            </WanderlustAmbientField>
          </WanderlustSurface>
        </div>
      </motion.div>

      <AnimatePresence>
        {(stage === 'modal' || stage === 'falling' || stage === 'marching') && (
          <motion.div
            key="goblin-hero"
            initial={false}
            animate={goblinAnimate}
            exit={{ opacity: 0 }}
            transition={goblinTransition}
            onAnimationComplete={
              stage === 'falling' ? handleFallingComplete : stage === 'marching' ? onClose : undefined
            }
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: goblinSize,
              height: goblinSize,
              marginLeft: -goblinHalf,
              marginTop: -goblinHalf,
              zIndex: 10,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <img
              src={GOBLIN_IMAGE}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6))',
              }}
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {stage === 'done' && null}
    </div>
  );
};

export default WorldSurfaceEventCard;
