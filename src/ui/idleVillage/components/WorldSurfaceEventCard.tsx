/**
 * WorldSurfaceEventCard — Goblin Invasion announcement shown at the peak of the shroud.
 *
 * Uses the `MatericEventCard` primitive from the design system. After the
 * player confirms, the card shrinks and glides to the top-right of the world,
 * matching the shroud-to-sticker behavior of the previous event card.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { GoblinInvasionWindow } from '@/ui/idleVillage/components/GoblinInvasionWindow';
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
  /** World canvas size (kept for compatibility with the renderer contract). */
  canvasSize: { width: number; height: number };
  /** Current world camera (kept for compatibility with the renderer contract). */
  camera: { panX: number; panY: number; zoom: number };
  /** World point where the goblins fall (kept for compatibility with the renderer contract). */
  fallTarget: { x: number; y: number };
  /** World point the goblins slowly march toward (kept for compatibility with the renderer contract). */
  marchTarget: { x: number; y: number };
}

type Stage = 'idle' | 'modal' | 'reminder';

const DAYS_LEFT = Number(trailerConfig.threat.announcement.timerRing.number) || 5;
const REMINDER_DURATION_MS = 200_500;

export const WorldSurfaceEventCard: React.FC<WorldSurfaceEventCardProps> = ({
  visible,
  zIndex,
  onComplete,
  onClose,
  worldCenter,
  canvasSize,
}) => {
  const { t } = useTranslation('idleVillage');
  const [stage, setStage] = useState<Stage>('idle');
  const [daysLeft] = useState<number>(DAYS_LEFT);

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
    if (stage !== 'reminder') return undefined;
    const timer = window.setTimeout(() => onClose?.(), REMINDER_DURATION_MS);
    return () => window.clearTimeout(timer);
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
    setStage('reminder');
  }, [daysLeft, onComplete, stage]);

  if (!visible) {
    return null;
  }

  const isModal = stage === 'modal';

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
        <MatericEventCard
          variant="modal"
          badge={String(t('world.goblinInvasion.invasion'))}
          subtitle={String(t('world.goblinInvasion.subtitle', { count: daysLeft }))}
          image={
            <div style={{ width: 364, height: 294, overflow: 'hidden', margin: '0 auto' }}>
              <GoblinInvasionWindow
                ariaLabel={String(t('world.goblinInvasion.title'))}
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
            transform: 'translate(-50%, -50%)',
            maxWidth: 460,
            width: 460,
            minHeight: 500,
          }}
        />
      </motion.div>
    </div>
  );
};

export default WorldSurfaceEventCard;
