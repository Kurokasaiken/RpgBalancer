import React from 'react';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';

/**
 * Gilded decorative frame for the event reminder.
 *
 * Sculpted metal corners with inset gems and an inner gold lip. The frame
 * should read as an artifact resting on the map, not a generic UI border.
 */
export const GildedEventFrame: React.FC = () => {
  const { gilded } = eventReminderTokens;

  return (
    <svg
      viewBox="0 0 420 142"
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
        <filter id="gem-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* outer raised border */}
      <path
        d="M 28 6 H 392 Q 414 6 414 28 V 114 Q 414 136 392 136 H 28 Q 6 136 6 114 V 28 Q 6 6 28 6 Z"
        fill={gilded.ornamentFill}
        stroke={gilded.frameOuter}
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
      {/* inner enamel lip */}
      <path
        d="M 30 12 H 390 Q 408 12 408 30 V 112 Q 408 130 390 130 H 30 Q 12 130 12 112 V 30 Q 12 12 30 12 Z"
        fill="none"
        stroke={gilded.frameStroke}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {/* bright inner line */}
      <path
        d="M 34 16 H 386 Q 402 16 402 32 V 110 Q 402 126 386 126 H 34 Q 18 126 18 110 V 32 Q 18 16 34 16 Z"
        fill="none"
        stroke={gilded.ornamentStroke}
        strokeWidth={0.8}
        opacity={0.6}
        vectorEffect="non-scaling-stroke"
      />

      {/* corner brackets */}
      <g stroke={gilded.frameStroke} fill="none" strokeWidth={2.5} vectorEffect="non-scaling-stroke">
        <path d="M 6 34 V 28 Q 6 6 28 6 H 34" />
        <path d="M 386 6 H 392 Q 414 6 414 28 V 34" />
        <path d="M 414 108 V 114 Q 414 136 392 136 H 386" />
        <path d="M 34 136 H 28 Q 6 136 6 114 V 108" />
      </g>

      {/* corner gems */}
      <g fill={gilded.gemFill} stroke={gilded.gemStroke} strokeWidth={0.8} filter="url(#gem-glow)">
        <circle cx="14" cy="14" r="4" />
        <circle cx="406" cy="14" r="4" />
        <circle cx="14" cy="128" r="4" />
        <circle cx="406" cy="128" r="4" />
      </g>
    </svg>
  );
};

export default GildedEventFrame;
