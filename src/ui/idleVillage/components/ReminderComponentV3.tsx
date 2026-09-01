import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PoiMatericV3_5 } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { SkinTitle } from '@/ui/idleVillage/skins/primitives/SkinTitle';
import { GildedEventFrameV3 } from './GildedEventFrameV3';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const { sizing, poi, glow, surface, gilded, v3, title: titleTokens, countdown: countdownTokens } = eventReminderTokens;

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

const StaticPoi: React.FC<{ size: number }> = ({ size }) => (
  <PoiMatericV3_5
    type="event"
    state="active"
    progress={1}
    timerDirection="counterclockwise"
    size={size}
  />
);

export type ReminderState = 'calm' | 'urgent' | 'active';

export interface ReminderComponentV3Props {
  title: string;
  daysLeftLabel: string;
  daysLeftValue: number;
  state?: ReminderState;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Gilded event reminder V3.
 *
 * Tighter visual hierarchy, smaller POI, jewel-set plaque SVG, and a stone
 * texture overlay. Designed to feel like a single imperial artifact.
 */
export const ReminderComponentV3: React.FC<ReminderComponentV3Props> = ({
  title,
  daysLeftLabel,
  daysLeftValue,
  state = 'calm',
  onClick,
  style,
}) => {
  const stateTokens = eventReminderTokens.states[state];
  const reduced = useReducedMotion();
  const uid = React.useId().replace(/:/g, '');
  const stoneFilterId = `reminder-stone-${uid}`;
  const rootRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    trackTelemetryEvent('event_reminder_click', {
      eventType: 'event_reminder_click',
      data: { title },
      context: 'event-reminder',
      timestamp: Date.now(),
      metadata: { variant: 'v3' },
    });
    onClick?.();
  }, [onClick, title]);

  const scaledPoiSize = Math.round(sizing.poiSize * v3.poiScale);

  return (
    <motion.button
      ref={rootRef}
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
      } as React.CSSProperties}
    >
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <filter id={stoneFilterId} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="14" result="noise" />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 .015  0 0 0 0 .03  0 0 0 0 .04  0 0 0 .15 0"
              result="tinted"
            />
            <feComposite in="SourceGraphic" in2="tinted" operator="in" />
            <feBlend in="SourceGraphic" in2="tinted" mode="overlay" />
          </filter>
        </defs>
      </svg>

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
      <span
        style={{
          position: 'absolute',
          inset: 10,
          borderRadius: 10,
          background: v3.surfaceTexture,
          zIndex: 2,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <span
        style={{
          position: 'absolute',
          inset: 10,
          borderRadius: 10,
          filter: `url(#${stoneFilterId})`,
          opacity: 0.6,
          zIndex: 3,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <GildedEventFrameV3 />
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
        <SkinScope
          style={{
            position: 'relative',
            zIndex: 7,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '18px 24px',
            maxWidth: sizing.width - 36,
            width: '100%',
            minHeight: sizing.minHeight - 20,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: scaledPoiSize,
              height: scaledPoiSize + 14,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: 7,
              marginLeft: 5,
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: -12,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${gilded.gemGlow} 0%, transparent 65%)`,
                filter: 'blur(12px)',
                opacity: v3.poiGlowOpacity,
                zIndex: 0,
              }}
              aria-hidden="true"
            />
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                filter: 'saturate(0.9) brightness(0.95)',
              }}
            >
              <StaticPoi size={scaledPoiSize} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              flex: 1,
              paddingLeft: 10,
            }}
          >
            <SkinTitle
              level="1"
              style={{
                fontSize: v3.titleSize,
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
                position: 'relative',
                marginTop: 8,
                height: 46,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 14px',
              }}
            >
              <svg
                viewBox="0 0 126 46"
                width={126}
                height={46}
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'visible',
                  filter: v3.plaqueShadow,
                }}
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={`v3-plaque-${uid}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(8,18,31,0.96)" />
                    <stop offset="100%" stopColor="rgba(2,10,14,0.99)" />
                  </linearGradient>
                  <linearGradient id={`v3-plaque-shine-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <rect
                  x="1"
                  y="1"
                  width="124"
                  height="44"
                  rx="9"
                  fill={`url(#v3-plaque-${uid})`}
                  stroke={stateTokens.plaqueBorder}
                  strokeWidth="1.5"
                />
                <rect
                  x="6"
                  y="6"
                  width="114"
                  height="34"
                  rx="6"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.8"
                />
                <rect
                  x="1"
                  y="1"
                  width="124"
                  height="44"
                  rx="9"
                  fill={`url(#v3-plaque-shine-${uid})`}
                  style={{ mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'] }}
                />
              </svg>
              <SkinTitle
                level="subtitle"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: v3.labelSize,
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
                  position: 'relative',
                  zIndex: 1,
                  fontSize: v3.numberSize,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: v3.numberColor,
                  textShadow: stateTokens.numberGlow,
                }}
              >
                {daysLeftValue}
              </SkinTitle>
            </div>
          </div>
        </SkinScope>
      </span>
      <span
        style={{
          position: 'absolute',
          inset: '6% 8%',
          borderRadius: 'inherit',
          background: v3.glare,
          opacity: reduced ? 0.2 : 0.4,
          pointerEvents: 'none',
          zIndex: 6,
        }}
        aria-hidden="true"
      />
    </motion.button>
  );
};

export default ReminderComponentV3;
