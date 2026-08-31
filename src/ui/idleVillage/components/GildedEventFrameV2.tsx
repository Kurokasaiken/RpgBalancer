import React from 'react';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';

/**
 * Gilded decorative frame V2 for the event reminder.
 *
 * Unified NMM border with continuous fillets, inset cabochon gems,
 * and no hooked side handles. Designed to read as a single artifact.
 */
export const GildedEventFrameV2: React.FC = () => {
  const { gilded, v2 } = eventReminderTokens;

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
        <linearGradient id="gilded-v2-frame-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gilded.frameGradientStart} />
          <stop offset="35%" stopColor={gilded.frameGradientMid} />
          <stop offset="70%" stopColor={gilded.frameGradientMid} />
          <stop offset="100%" stopColor={gilded.frameGradientEnd} />
        </linearGradient>
        <radialGradient id="gilded-v2-gem" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={gilded.gemFace} />
          <stop offset="45%" stopColor={gilded.gemFill} />
          <stop offset="100%" stopColor={gilded.gemShadow} />
        </radialGradient>
        <filter id="gilded-v2-gem-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer raised band */}
      <path
        d="M 24 4 H 396 Q 416 4 416 24 V 132 Q 416 152 396 152 H 24 Q 4 152 4 132 V 24 Q 4 4 24 4 Z"
        fill="none"
        stroke="url(#gilded-v2-frame-gold)"
        strokeWidth={4.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* Inner fine fillets — one continuous band */}
      <path
        d="M 34 14 H 386 Q 400 14 400 28 V 128 Q 400 142 386 142 H 34 Q 20 142 20 128 V 28 Q 20 14 34 14 Z"
        fill="none"
        stroke={v2.handleStroke}
        strokeWidth={1.2}
        opacity={v2.handleOpacity}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 42 22 H 378 Q 392 22 392 36 V 120 Q 392 134 378 134 H 42 Q 28 134 28 120 V 36 Q 28 22 42 22 Z"
        fill="none"
        stroke={gilded.ornamentStroke}
        strokeWidth={0.8}
        opacity={0.45}
        vectorEffect="non-scaling-stroke"
      />

      {/* Corner gems */}
      <g>
        {[
          { cx: 22, cy: 22 },
          { cx: 398, cy: 22 },
          { cx: 22, cy: 134 },
          { cx: 398, cy: 134 },
        ].map(({ cx, cy }) => (
          <g key={`gem-v2-${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={6.5} fill={gilded.gemBezel} stroke="#8a6a35" strokeWidth={1} />
            <circle cx={cx} cy={cy} r={5} fill="url(#gilded-v2-gem)" filter="url(#gilded-v2-gem-glow)" />
            <ellipse
              cx={cx - 1.4}
              cy={cy - 1.4}
              rx={1.8}
              ry={1.1}
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

export default GildedEventFrameV2;
