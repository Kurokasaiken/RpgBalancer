import React from 'react';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';

/**
 * Gilded decorative frame for the event reminder.
 *
 * Sculpted metal corners with inset cabochon gems, an inner gold lip,
 * and side handles. The frame should read as a single heavy artifact.
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
        filter: `drop-shadow(0 6px 10px ${gilded.frameShadow})`,
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
        <radialGradient id="gilded-gem" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={gilded.gemFace} />
          <stop offset="45%" stopColor={gilded.gemFill} />
          <stop offset="100%" stopColor={gilded.gemShadow} />
        </radialGradient>
        <filter id="gilded-gem-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
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
        d="M 24 4 H 396 Q 416 4 416 24 V 132 Q 416 152 396 152 H 24 Q 4 152 4 132 V 24 Q 4 4 24 4 Z"
        fill="none"
        stroke="url(#gilded-frame-gold)"
        strokeWidth={4}
        filter="url(#gilded-metal-noise)"
        vectorEffect="non-scaling-stroke"
      />
      {/* Highlighted top edge */}
      <path
        d="M 26 6 H 394 Q 414 6 414 26 V 30 H 6 V 26 Q 6 6 26 6 Z"
        fill={gilded.frameGradientStart}
        opacity={0.2}
      />
      {/* Inner enamel lip */}
      <path
        d="M 34 14 H 386 Q 400 14 400 28 V 128 Q 400 142 386 142 H 34 Q 20 142 20 128 V 28 Q 20 14 34 14 Z"
        fill={surface.texture}
        stroke="url(#gilded-ornament-gold)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {/* Bright accent line */}
      <path
        d="M 42 22 H 378 Q 392 22 392 36 V 120 Q 392 134 378 134 H 42 Q 28 134 28 120 V 36 Q 28 22 42 22 Z"
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
        strokeWidth={2.8}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M 6 48 V 22 Q 6 4 28 4 H 58 M 58 4 V 64" />
        <path d="M 362 4 H 392 Q 416 4 416 28 V 58 M 416 58 V 100" />
        <path d="M 416 112 V 134 Q 416 152 392 152 H 362 M 362 152 V 92" />
        <path d="M 58 152 H 28 Q 4 152 4 128 V 98 M 4 98 V 54" />
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
        <path d="M 12 52 V 104" />
        <path d="M 408 52 V 104" />
        <path d="M 20 40 V 116" opacity={0.4} />
        <path d="M 400 40 V 116" opacity={0.4} />
      </g>

      {/* Corner gems: bezel + cabochon + specular */}
      <g>
        {[
          { cx: 14, cy: 14 },
          { cx: 406, cy: 14 },
          { cx: 14, cy: 142 },
          { cx: 406, cy: 142 },
        ].map(({ cx, cy }) => (
          <g key={`gem-${cx}-${cy}`}>
            {/* bezel / socket */}
            <circle cx={cx} cy={cy} r={7} fill={gilded.gemBezel} stroke="#8a6a35" strokeWidth={1} />
            {/* cabochon */}
            <circle cx={cx} cy={cy} r={5.5} fill="url(#gilded-gem)" filter="url(#gilded-gem-glow)" />
            {/* specular */}
            <ellipse
              cx={cx - 1.5}
              cy={cy - 1.5}
              rx={2}
              ry={1.2}
              fill={gilded.gemSpecular}
              opacity={0.65}
              filter="blur(.4px)"
            />
          </g>
        ))}
      </g>
    </svg>
  );
};

export default GildedEventFrame;
