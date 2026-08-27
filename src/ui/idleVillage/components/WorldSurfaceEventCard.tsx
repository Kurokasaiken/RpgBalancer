/**
 * WorldSurfaceEventCard — Goblin Invasion announcement shown at the peak of the shroud.
 *
 * Uses the `MatericEventCard` primitive from the design system so the event
 * announcement matches the component shown in the `/primitives` Event tab.
 */

import React, { useCallback, useState } from 'react';
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

const DAYS_LEFT = Number(trailerConfig.threat.announcement.timerRing.number) || 5;

export const WorldSurfaceEventCard: React.FC<WorldSurfaceEventCardProps> = ({
  visible,
  zIndex,
  onComplete,
  onClose,
  worldCenter,
}) => {
  const { t } = useTranslation('idleVillage');
  const [daysLeft] = useState<number>(DAYS_LEFT);

  const handleAction = useCallback(() => {
    trackTelemetryEvent('world_surface_event_ack', {
      eventType: 'world_surface_event_ack',
      data: { event: 'goblin_invasion', daysLeft },
      context: 'world-surface-event-card',
      timestamp: Date.now(),
      metadata: {},
    });
    onComplete?.();
    onClose?.();
  }, [daysLeft, onComplete, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: worldCenter.x,
        top: worldCenter.y,
        zIndex,
      }}
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
    </div>
  );
};

export default WorldSurfaceEventCard;
