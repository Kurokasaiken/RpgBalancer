import React from 'react';
import { eventReminderTokens } from '@/balancing/config/idleVillage/eventReminderTokens';

/**
 * Event medallion shown on the left of the reminder.
 *
 * A bronze ring with an engraved cross and a small teal gem, matching the
 * gilded/imperial visual language of the mockup.
 */
export const EventReminderPoi: React.FC = () => {
  const { medallion, gilded } = eventReminderTokens;

  return (
    <svg
      viewBox="0 0 92 92"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="medallion-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b2b1a" />
          <stop offset="28%" stopColor="#9e7b4a" />
          <stop offset="52%" stopColor="#5d4a30" />
          <stop offset="76%" stopColor="#c69c5a" />
          <stop offset="100%" stopColor="#3b2b1a" />
        </linearGradient>
        <filter id="medallion-gem-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* outer ring */}
      <circle cx="46" cy="46" r="44" fill="url(#medallion-ring)" />
      {/* inner enamel */}
      <circle cx="46" cy="46" r="36" fill={medallion.inner} stroke={gilded.frameStroke} strokeWidth={1} />
      {/* engraved rune ring */}
      <circle
        cx="46"
        cy="46"
        r="31"
        fill="none"
        stroke={gilded.ornamentStroke}
        strokeWidth={1.5}
        strokeDasharray="4 4"
        opacity={0.5}
      />
      {/* cross */}
      <path
        d="M 46 22 V 70 M 22 46 H 70"
        stroke={medallion.cross}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M 46 28 V 40 M 52 46 H 64"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* gem */}
      <ellipse cx="46" cy="72" rx="5" ry="8" fill={medallion.gem} filter="url(#medallion-gem-glow)" />
    </svg>
  );
};

export default EventReminderPoi;
