import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { PoiMatericV3 } from '@/ui/idleVillage/components/poi/PoiMatericV3';
import { SkinTitle } from '@/ui/idleVillage/skins/primitives/SkinTitle';
import { GildedEventFrame } from './GildedEventFrame';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const { sizing, poi, glow, surface, gilded, title: titleTokens, countdown: countdownTokens } = eventReminderTokens;

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
export type ReminderState = 'calm' | 'urgent' | 'active';

export interface ReminderComponentProps {
  /** Title shown on the reminder (e.g. "INVASION"). */
  title: string;
  /** Days-left label shown under the title (e.g. "DAYS REMAINING"). */
  daysLeftLabel: string;
  /** Numeric days remaining, rendered large next to the label. */
  daysLeftValue: number;
  /** Temporal state that drives color/animation intensity. */
  state?: ReminderState;
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
  daysLeftValue,
  state = 'calm',
  onClick,
  style,
}) => {
  const stateTokens = eventReminderTokens.states[state];

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
          background: `radial-gradient(ellipse, ${stateTokens.frameGlow}, transparent 70%)`,
          filter: 'blur(22px)',
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
          background: `${surface.background}, radial-gradient(circle at 18% 50%, rgba(22,141,147,.15) 0%, transparent 40%)`,
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
          image={(
            <div
              style={{
                position: 'relative',
                width: sizing.poiSize,
                height: sizing.poiSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: -14,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${gilded.gemGlow} 0%, transparent 65%)`,
                  filter: 'blur(12px)',
                  opacity: 0.55,
                  zIndex: 0,
                }}
                aria-hidden="true"
              />
              <div style={{ position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 18px ${gilded.gemGlow})` }}>
                <FillingPoi size={sizing.poiSize} fillDurationMs={poi.fillDurationMs} />
              </div>
            </div>
          )}
          style={{
            maxWidth: sizing.width - 36,
            width: '100%',
            minHeight: sizing.minHeight - 20,
          }}
        >
          <SkinTitle
            level="1"
            style={{
              fontSize: 30,
              lineHeight: 1.05,
              letterSpacing: '0.04em',
              color: titleTokens.color,
              textShadow: `${titleTokens.shadow}, ${titleTokens.highlight}`,
            }}
          >
            {title}
          </SkinTitle>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <SkinTitle
              level="subtitle"
              style={{
                fontSize: countdownTokens.labelSize,
                letterSpacing: '0.18em',
                lineHeight: 1.3,
                textTransform: 'uppercase',
                color: countdownTokens.labelColor,
                textShadow: countdownTokens.labelGlow,
                opacity: 0.9,
              }}
            >
              {daysLeftLabel}
            </SkinTitle>
            <SkinTitle
              level="1"
              style={{
                fontSize: countdownTokens.numberSize,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: countdownTokens.numberColor,
                textShadow: countdownTokens.numberGlow,
              }}
            >
              {daysLeftValue}
            </SkinTitle>
          </div>
        </MatericEventCard>
      </span>
    </motion.button>
  );
};

export default ReminderComponent;
