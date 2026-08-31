import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { PoiMatericV3_5 } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import { SkinTitle } from '@/ui/idleVillage/skins/primitives/SkinTitle';
import { GildedEventFrameV2 } from './GildedEventFrameV2';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const { sizing, poi, glow, surface, gilded, v2, title: titleTokens, countdown: countdownTokens } = eventReminderTokens;

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

export type ReminderState = 'calm' | 'urgent' | 'active';

export interface ReminderComponentV2Props {
  title: string;
  daysLeftLabel: string;
  daysLeftValue: number;
  state?: ReminderState;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const ReminderComponentV2: React.FC<ReminderComponentV2Props> = ({
  title,
  daysLeftLabel,
  daysLeftValue,
  state = 'calm',
  onClick,
  style,
}) => {
  const stateTokens = eventReminderTokens.states[state];
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLButtonElement>(null);
  const uid = useId().replace(/:/g, '');
  const glassFilterId = `reminder-glass-${uid}`;
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);

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
      metadata: { variant: 'v2' },
    });
    onClick?.();
  }, [onClick, title]);

  const scaledPoiSize = Math.round(sizing.poiSize * v2.poiScale);

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
      <GildedEventFrameV2 />
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
        <MatericEventCard
          variant="reminder"
          image={(
            <div
              style={{
                position: 'relative',
                width: scaledPoiSize,
                height: scaledPoiSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: -12,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${gilded.gemGlow} 0%, transparent 65%)`,
                  filter: 'blur(12px)',
                  opacity: v2.poiGlowOpacity,
                  zIndex: 0,
                }}
                aria-hidden="true"
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  filter: `drop-shadow(0 0 14px ${gilded.gemGlow}) ${reduced ? '' : `url(#${glassFilterId})`}`,
                  transform: reduced
                    ? 'none'
                    : `translate3d(calc(var(--mx) * 5px), calc(var(--my) * 3px), 0)`,
                }}
              >
                <FillingPoi size={scaledPoiSize} fillDurationMs={poi.fillDurationMs} />
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
              fontSize: 28,
              lineHeight: 1.05,
              letterSpacing: '0.04em',
              color: titleTokens.color,
              textShadow: `${titleTokens.shadow}, ${titleTokens.highlight}`,
            }}
          >
            {title}
          </SkinTitle>
          <div
            style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 10,
              padding: '6px 14px',
              borderRadius: 8,
              border: `1px solid ${stateTokens.plaqueBorder}`,
              background: `${v2.plaqueShine}, ${v2.plaqueBg}`,
              boxShadow: v2.plaqueShadow,
            }}
          >
            <SkinTitle
              level="subtitle"
              style={{
                fontSize: 9,
                letterSpacing: '0.2em',
                lineHeight: 1.3,
                textTransform: 'uppercase',
                color: stateTokens.plaqueText,
                textShadow: countdownTokens.labelGlow,
                opacity: 0.9,
              }}
            >
              {daysLeftLabel}
            </SkinTitle>
            <SkinTitle
              level="1"
              style={{
                fontSize: 44,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: countdownTokens.numberColor,
                textShadow: stateTokens.numberGlow,
              }}
            >
              {daysLeftValue}
            </SkinTitle>
          </div>
        </MatericEventCard>
      </span>
      <span
        style={{
          position: 'absolute',
          inset: '8% 6%',
          borderRadius: 'inherit',
          background: v2.glare,
          opacity: reduced ? 0.5 : 0.85,
          pointerEvents: 'none',
          zIndex: 6,
        }}
        aria-hidden="true"
      />
    </motion.button>
  );
};

export default ReminderComponentV2;
