import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { PoiMatericV3 } from '@/ui/idleVillage/components/poi/PoiMatericV3';
import { GildedEventFrame } from './GildedEventFrame';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const { sizing, poi, glow, surface } = eventReminderTokens;

/**
 * POI that starts with an empty magic circle and fills counter-clockwise.
 */
const FillingPoi: React.FC<{ size: number; fillDurationMs: number }> = ({
  size,
  fillDurationMs,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / fillDurationMs);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fillDurationMs]);

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

/**
 * Props for the ReminderComponent.
 */
export interface ReminderComponentProps {
  /** Title shown on the reminder (e.g. "INVASION"). */
  title: string;
  /** Days-left label shown under the title. */
  daysLeftLabel: string;
  /** Called when the player clicks the reminder to open event details. */
  onClick?: () => void;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

/**
 * Small, persistent event reminder shown in the world-surface map.
 *
 * Displays a gilded hand-forged frame, the event title, a days-remaining
 * label, and a slowly filling POI medallion to signal that the threat is still
 * active. Clicking it emits telemetry and calls `onClick`.
 */
export const ReminderComponent: React.FC<ReminderComponentProps> = ({
  title,
  daysLeftLabel,
  onClick,
  style,
}) => {
  const handleClick = useCallback(() => {
    trackTelemetryEvent('event_reminder_click', {
      eventType: 'event_reminder_click',
      data: { title },
      context: 'event-reminder',
      timestamp: Date.now(),
      metadata: {},
    });
    onClick?.();
  }, [onClick, title]);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={title}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'relative',
        width: sizing.width,
        minHeight: sizing.minHeight,
        padding: 0,
        border: 0,
        background: 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: '12% 8%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${glow.ambient}, transparent 70%)`,
          filter: 'blur(18px)',
          opacity: glow.ambientOpacity,
          zIndex: 0,
        }}
        aria-hidden="true"
      />
      <span
        style={{
          position: 'absolute',
          inset: 10,
          borderRadius: 10,
          background: surface.background,
          boxShadow: surface.boxShadow,
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      <GildedEventFrame />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 18px',
          pointerEvents: 'none',
        }}
      >
        <MatericEventCard
          variant="reminder"
          title={title}
          daysLeftLabel={daysLeftLabel}
          image={<FillingPoi size={sizing.poiSize} fillDurationMs={poi.fillDurationMs} />}
          style={{
            maxWidth: sizing.width - 36,
            width: '100%',
            minHeight: sizing.minHeight - 20,
          }}
        />
      </span>
    </motion.button>
  );
};

export default ReminderComponent;
