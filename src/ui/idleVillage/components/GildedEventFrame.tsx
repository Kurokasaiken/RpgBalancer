import React from 'react';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';

/**
 * Gilded decorative frame for the event reminder.
 *
 * Sculpted metal corners with inset gems and an inner gold lip. The frame
 * should read as an artifact resting on the map, not a generic UI border.
 */
export const GildedEventFrame: React.FC = () => {
  const { gilded, surface } = eventReminderTokens;

  return (
    <svg
      viewBox="0 0 420 156"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 4,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gilded-frame-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gilded.frameGradientStart} />
          <stop offset="35%" stopColor={gilded.frameGradientMid} />
          <stop offset="65%" stopColor={gilded.frameGradientMid} />
          <stop offset="100%" stopColor={gilded.frameGradientEnd} />
        </linearGradient>
        <linearGradient id="gilded-ornament-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={gilded.ornamentStroke} stopOpacity={0.85} />
          <stop offset="50%" stopColor={gilded.ornamentStroke} stopOpacity={0.4} />
          <stop offset="100%" stopColor={gilded.ornamentStroke} stopOpacity={0.85} />
        </linearGradient>
        <filter id="gilded-gem-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="gilded-metal-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="5" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0"
            result="softNoise"
          />
          <feComposite in="softNoise" in2="SourceGraphic" operator="in" result="clipped" />
          <feBlend in="SourceGraphic" in2="clipped" mode="multiply" />
        </filter>
      </defs>

      {/* Outer raised border */}
      <path
        d="M 22 4 H 398 Q 416 4 416 22 V 134 Q 416 152 398 152 H 22 Q 4 152 4 134 V 22 Q 4 4 22 4 Z"
        fill={gilded.ornamentFill}
        stroke="url(#gilded-frame-gold)"
        strokeWidth={3.5}
        filter="url(#gilded-metal-noise)"
        vectorEffect="non-scaling-stroke"
      />
      {/* Inner enamel lip */}
      <path
        d="M 30 14 H 390 Q 404 14 404 28 V 128 Q 404 142 390 142 H 30 Q 16 142 16 128 V 28 Q 16 14 30 14 Z"
        fill={surface.texture}
        stroke="url(#gilded-ornament-gold)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {/* Bright accent line */}
      <path
        d="M 38 22 H 382 Q 396 22 396 36 V 120 Q 396 134 382 134 H 38 Q 24 134 24 120 V 36 Q 24 22 38 22 Z"
        fill="none"
        stroke={gilded.ornamentStroke}
        strokeWidth={0.8}
        opacity={0.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* Asymmetric corner brackets */}
      <g
        fill="none"
        stroke="url(#gilded-frame-gold)"
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M 6 42 V 22 Q 6 4 28 4 H 48" />
        <path d="M 372 4 H 392 Q 416 4 416 28 V 48" />
        <path d="M 414 114 V 134 Q 414 152 392 152 H 372" />
        <path d="M 48 152 H 28 Q 4 152 4 128 V 108" />
      </g>

      {/* Corner gems */}
      <g fill={gilded.gemFill} stroke={gilded.gemStroke} strokeWidth={0.8} filter="url(#gilded-gem-glow)">
        <circle cx="14" cy="14" r="5" />
        <circle cx="406" cy="14" r="5" />
        <circle cx="14" cy="142" r="5" />
        <circle cx="406" cy="142" r="5" />
      </g>
    </svg>
  );
};

export default GildedEventFrame;
