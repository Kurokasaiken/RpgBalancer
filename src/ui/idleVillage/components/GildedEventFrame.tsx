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
          <stop offset="30%" stopColor={gilded.frameGradientMid} />
          <stop offset="70%" stopColor={gilded.frameGradientMid} />
          <stop offset="100%" stopColor={gilded.frameGradientEnd} />
        </linearGradient>
        <linearGradient id="gilded-ornament-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={gilded.ornamentStroke} stopOpacity={0.9} />
          <stop offset="50%" stopColor={gilded.ornamentStroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={gilded.ornamentStroke} stopOpacity={0.9} />
        </linearGradient>
        <radialGradient id="gilded-gem" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#7fd6cd" />
          <stop offset="45%" stopColor={gilded.gemFill} />
          <stop offset="100%" stopColor="#1f5a52" />
        </radialGradient>
        <filter id="gilded-gem-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="gilded-frame-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity={0.55} />
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
        d="M 24 4 H 396 Q 416 4 416 24 V 132 Q 416 152 396 152 H 24 Q 4 152 4 132 V 24 Q 4 4 24 4 Z"
        fill={gilded.ornamentFill}
        stroke="url(#gilded-frame-gold)"
        strokeWidth={3.5}
        filter="url(#gilded-frame-shadow)"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 24 4 H 396 Q 416 4 416 24 V 132 Q 416 152 396 152 H 24 Q 4 152 4 132 V 24 Q 4 4 24 4 Z"
        fill="none"
        stroke="url(#gilded-frame-gold)"
        strokeWidth={3.5}
        filter="url(#gilded-metal-noise)"
        vectorEffect="non-scaling-stroke"
      />
      {/* Inner enamel lip */}
      <path
        d="M 32 14 H 388 Q 402 14 402 28 V 128 Q 402 142 388 142 H 32 Q 18 142 18 128 V 28 Q 18 14 32 14 Z"
        fill={surface.texture}
        stroke="url(#gilded-ornament-gold)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {/* Bright accent line */}
      <path
        d="M 40 22 H 380 Q 394 22 394 36 V 120 Q 394 134 380 134 H 40 Q 26 134 26 120 V 36 Q 26 22 40 22 Z"
        fill="none"
        stroke={gilded.ornamentStroke}
        strokeWidth={0.8}
        opacity={0.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* Asymmetric corner brackets with longer side handles */}
      <g
        fill="none"
        stroke="url(#gilded-frame-gold)"
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M 6 46 V 22 Q 6 4 28 4 H 56 M 56 4 V 60" />
        <path d="M 364 4 H 392 Q 416 4 416 28 V 56 M 416 56 V 100" />
        <path d="M 416 110 V 134 Q 416 152 392 152 H 364 M 364 152 V 96" />
        <path d="M 56 152 H 28 Q 4 152 4 128 V 100 M 4 100 V 56" />
      </g>

      {/* Decorative vertical ribs along the side handles */}
      <g
        fill="none"
        stroke={gilded.ornamentStroke}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.6}
        vectorEffect="non-scaling-stroke"
      >
        <path d="M 14 52 V 104" />
        <path d="M 406 52 V 104" />
        <path d="M 22 40 V 116" opacity={0.4} />
        <path d="M 398 40 V 116" opacity={0.4} />
      </g>

      {/* Corner gems */}
      <g
        fill="url(#gilded-gem)"
        stroke={gilded.gemStroke}
        strokeWidth={0.8}
        filter="url(#gilded-gem-glow)"
      >
        <circle cx="14" cy="14" r="6" />
        <circle cx="406" cy="14" r="6" />
        <circle cx="14" cy="142" r="6" />
        <circle cx="406" cy="142" r="6" />
      </g>
    </svg>
  );
};

export default GildedEventFrame;
