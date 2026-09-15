import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SkinTitle } from '@/ui/idleVillage/skins/primitives/SkinTitle';
import { GildedEventFrame } from './GildedEventFrame';
import { eventReminderTokens, bandForDays, REMINDER_BANDS } from '@/balancing/config/idleVillage/eventReminderTokens';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const { sizing, glow, threatSurface, gilded, title: titleTokens } = eventReminderTokens;

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
 * Props for the ReminderComponent.
 */
export type ReminderState = 'calm' | 'urgent' | 'active';

export interface ReminderComponentProps {
  /** Title shown on the reminder (e.g. "INVASION"). */
  title: string;
  /** Numeric days remaining, rendered large as the primary data. */
  daysLeftValue: number;
  /** Optional: Called when the player clicks the reminder to open event details. */
  onClick?: () => void;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

/**
 * Small, persistent event reminder shown in the world-surface map.
 *
 * V1 redesign: inverted hierarchy (64px number dominates, title secondary).
 * Band-based state (distant/closing/imminent) with triple-encoded state
 * (color + glyph + text). Flash animation on band transition only (no pulsing).
 * Clicking it emits telemetry and calls `onClick`.
 */
export const ReminderComponent: React.FC<ReminderComponentProps> = ({
  title,
  daysLeftValue,
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
          background: threatSurface.background,
          boxShadow: threatSurface.boxShadow,
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
          {/* Medallion: dark bordered circle with the number inside it, per mockup */}
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
            {/* Simple dark medallion with a gold double ring — the runic POI art
                competes with the number for attention, so this reminder uses a
                plain disc instead (per mockup: legibility over iconography). */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #241814 0%, #0c0705 70%)',
                border: `3px solid ${gilded.frameStroke}`,
                boxShadow: `inset 0 0 0 2px rgba(0,0,0,.6), inset 0 2px 6px rgba(0,0,0,.8), 0 0 16px ${gilded.gemGlow}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: reduced
                  ? 'none'
                  : `translate3d(calc(var(--mx) * 6px), calc(var(--my) * 4px), 0)`,
              }}
            >
              {/* Inner thin ring, echoes the gilded frame's double-lip look */}
              <span
                style={{
                  position: 'absolute',
                  inset: 6,
                  borderRadius: '50%',
                  border: `1px solid ${gilded.ornamentStroke}`,
                  opacity: 0.55,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              />
            </div>
            {/* Number rendered inside the medallion */}
            <SkinTitle
              level="1"
              style={{
                position: 'absolute',
                zIndex: 2,
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: '#f5ede0',
                textShadow: '0 2px 4px rgba(0,0,0,.85), 0 0 12px rgba(0,0,0,.6)',
                fontVariantNumeric: 'tabular-nums',
                pointerEvents: 'none',
              }}
            >
              {daysLeftValue}
            </SkinTitle>
          </div>

          {/* Content: title + days label, matching the mockup's two-line plaque text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <SkinTitle
              level="1"
              style={{
                fontSize: 26,
                lineHeight: 1.1,
                letterSpacing: '0.04em',
                color: titleTokens.color,
                textShadow: titleTokens.shadow,
              }}
            >
              {title}
            </SkinTitle>

            <span
              style={{
                fontSize: 16,
                letterSpacing: '0.08em',
                lineHeight: 1.2,
                color: '#e7dcc4',
                textShadow: '0 1px 3px rgba(0,0,0,.7)',
              }}
            >
              {daysLeftValue} {daysLeftValue === 1 ? 'GIORNO' : 'GIORNI'}
            </span>

            {/* Band info: glyph + word, avoids color-only state encoding */}
            <span
              style={{
                marginTop: 2,
                fontSize: 13,
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
