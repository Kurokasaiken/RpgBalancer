import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { PoiMatericV3_5 } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import { SkinTitle } from '@/ui/idleVillage/skins/primitives/SkinTitle';
import { GildedEventFrame } from './GildedEventFrame';
import { eventReminderTokens, bandForDays, REMINDER_BANDS, type ReminderBand } from '@/balancing/config/idleVillage/eventReminderTokens';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const { sizing, poi, glow, surface, gilded, title: titleTokens, countdown: countdownTokens } = eventReminderTokens;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    if (mq.addEventListener) {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);
  return reduced;
}

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
    <PoiMatericV3_5
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
  // Map band to state tokens for color/glow
  const band = bandForDays(daysLeftValue);
  const bandDef = REMINDER_BANDS[band];
  const bandStateKey = band === 'imminent' ? 'active' : band === 'closing' ? 'urgent' : 'calm';
  const stateTokens = eventReminderTokens.states[bandStateKey];

  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLButtonElement>(null);
  const uid = useId().replace(/:/g, '');
  const glassFilterId = `reminder-glass-${uid}`;
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);

  // Flash only once when band changes, not continuously
  const prevBandRef = useRef(band);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevBandRef.current !== band) {
      prevBandRef.current = band;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [band]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMx((x - 0.5) * 2);
    setMy((y - 0.5) * 2);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setMx(0);
    setMy(0);
  }, []);

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
      ref={rootRef}
      type="button"
      onClick={handleClick}
      onPointerMove={reduced ? undefined : handlePointerMove}
      onPointerLeave={reduced ? undefined : handlePointerLeave}
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
        '--mx': mx.toFixed(3),
        '--my': my.toFixed(3),
        ...style,
      } as React.CSSProperties}
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
          background: surface.background,
          boxShadow: surface.boxShadow,
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      <GildedEventFrame />
      <svg
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        aria-hidden="true"
      >
        <defs>
          <filter id={glassFilterId} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feImage
              href="/assets/ui/glass_displacement.png"
              preserveAspectRatio="none"
              x="0"
              y="0"
              width="100%"
              height="100%"
              result="lens"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="lens"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
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
        <motion.div
          animate={flash && !reduced ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            width: '100%',
          }}
        >
          {/* POI medallion — now secondary */}
          <div
            style={{
              position: 'relative',
              width: sizing.poiSize,
              height: sizing.poiSize,
              flexShrink: 0,
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
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                filter: `drop-shadow(0 0 18px ${gilded.gemGlow}) ${reduced ? '' : `url(#${glassFilterId})`}`,
                transform: reduced
                  ? 'none'
                  : `translate3d(calc(var(--mx) * 6px), calc(var(--my) * 4px), 0)`,
              }}
            >
              <PoiMatericV3_5
                type="event"
                state="active"
                progress={1 - daysLeftValue / 50}
                timerDirection="counterclockwise"
                size={sizing.poiSize}
              />
            </div>
          </div>

          {/* Content: now INVERTED hierarchy — number dominates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            {/* Big number — primary read */}
            <SkinTitle
              level="1"
              style={{
                fontSize: 64,
                lineHeight: 0.9,
                letterSpacing: '-0.02em',
                color: stateTokens.plaqueText,
                textShadow: stateTokens.numberGlow,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {daysLeftValue}
            </SkinTitle>

            {/* Title + band: secondary reads */}
            <SkinTitle
              level="subtitle"
              style={{
                fontSize: 18,
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                color: titleTokens.color,
                textShadow: titleTokens.shadow,
              }}
            >
              {title}
            </SkinTitle>

            {/* Band info: glyph + word, avoids color-only state encoding */}
            <span
              style={{
                fontSize: 16,
                letterSpacing: '0.1em',
                lineHeight: 1.1,
                color: stateTokens.plaqueText,
                textShadow: stateTokens.numberGlow,
              }}
            >
              <span aria-hidden="true">{bandDef.glyph}</span> {bandDef.word}
            </span>
          </div>
        </motion.div>
      </span>
    </motion.button>
  );
};

export default ReminderComponent;
