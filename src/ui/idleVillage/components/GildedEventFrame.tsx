import React from 'react';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';

/**
 * Gilded decorative frame for the event reminder.
 *
 * Renders an asymmetric brass-and-gold SVG overlay that sits above the card
 * surface. Stroke widths are fixed via `vector-effect: non-scaling-stroke` so
 * the frame scales with the component without losing line weight.
 */
export const GildedEventFrame: React.FC = () => {
  const { gilded } = eventReminderTokens;

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
      <path
        d="M 24 14 H 396 Q 406 14 406 24 V 132 Q 406 142 396 142 H 24 Q 14 142 14 132 V 24 Q 14 14 24 14 Z"
        fill="none"
        stroke={gilded.frameStroke}
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 36 26 H 384 Q 394 26 394 36 V 120 Q 394 130 384 130 H 36 Q 26 130 26 120 V 36 Q 26 26 36 26 Z"
        fill="none"
        stroke={gilded.ornamentStroke}
        strokeWidth={1}
        opacity={0.6}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 14 14 L 40 40 M 406 14 L 380 40 M 14 142 L 40 116 M 406 142 L 380 116"
        stroke={gilded.ornamentStroke}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="14" cy="14" r="3" fill={gilded.gemFill} />
      <circle cx="406" cy="14" r="3" fill={gilded.gemFill} />
      <circle cx="14" cy="142" r="3" fill={gilded.gemFill} />
      <circle cx="406" cy="142" r="3" fill={gilded.gemFill} />
    </svg>
  );
};

export default GildedEventFrame;
