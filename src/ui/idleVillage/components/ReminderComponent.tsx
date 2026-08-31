import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GildedEventFrame } from './GildedEventFrame';
import { EventReminderPoi } from './EventReminderPoi';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const { sizing, content, glow, surface } = eventReminderTokens;

/**
 * Props for the ReminderComponent.
 */
export interface ReminderComponentProps {
  /** Title shown on the reminder (e.g. "INVASION"). */
  title: string;
  /** Number of days remaining until the event triggers. */
  daysRemaining: number;
  /** Called when the player clicks the reminder to open event details. */
  onClick?: () => void;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

/**
 * Small, persistent event reminder shown in the world-surface map.
 *
 * Displays a gilded hand-forged frame, the event title, a compact days-left
 * capsule, and a bronze medallion. Clicking it emits telemetry and calls
 * `onClick`.
 */
export const ReminderComponent: React.FC<ReminderComponentProps> = ({
  title,
  daysRemaining,
  onClick,
  style,
}) => {
  const { t } = useTranslation('idleVillage');

  const handleClick = useCallback(() => {
    trackTelemetryEvent('event_reminder_click', {
      eventType: 'event_reminder_click',
      data: { title, daysRemaining },
      context: 'event-reminder',
      timestamp: Date.now(),
      metadata: {},
    });
    onClick?.();
  }, [onClick, title, daysRemaining]);

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
          inset: '10% 6%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${glow.ambient}, transparent 70%)`,
          filter: 'blur(20px)',
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 7,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '0 28px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: sizing.medallionSize,
            height: sizing.medallionSize,
            flexShrink: 0,
          }}
        >
          <EventReminderPoi />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <span
            style={{
              display: 'block',
              fontSize: 30,
              fontWeight: 700,
              color: content.title,
              textShadow: content.titleShadow,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              lineHeight: 1.1,
            }}
          >
            {title}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: content.label,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {t('world.eventReminder.daysRemaining', { count: daysRemaining })}
            </span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: content.number,
                textShadow: content.numberGlow,
                lineHeight: 1,
              }}
            >
              {daysRemaining}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default ReminderComponent;
