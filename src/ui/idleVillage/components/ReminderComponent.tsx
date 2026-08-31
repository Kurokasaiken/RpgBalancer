import React, { useEffect, useState } from 'react';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { PoiMatericV3 } from '@/ui/idleVillage/components/poi/PoiMatericV3';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';

/**
 * Props for the ReminderComponent.
 */
export interface ReminderComponentProps {
  /** Title shown on the reminder (e.g. "INVASION"). */
  title: string;
  /** Days-left label shown under the title. */
  daysLeftLabel: string;
  /** Diameter of the POI medallion in design pixels. */
  poiSize?: number;
  /** Duration of the POI fill animation in milliseconds. */
  poiFillDurationMs?: number;
  /** Card width in design pixels. */
  width?: number;
  /** Minimum card height in design pixels. */
  minHeight?: number;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

const DEFAULT_POI_SIZE = 92;
const DEFAULT_WIDTH = 320;
const DEFAULT_MIN_HEIGHT = 140;

/**
 * Small, persistent event reminder shown in the top-right of the world surface.
 *
 * Displays the event title, a days-remaining label, and a slowly filling
 * POI medallion to signal that the threat is still active.
 */
export const ReminderComponent: React.FC<ReminderComponentProps> = ({
  title,
  daysLeftLabel,
  poiSize = DEFAULT_POI_SIZE,
  poiFillDurationMs = Number(trailerConfig.threat.goblin.poiFillDurationMs),
  width = DEFAULT_WIDTH,
  minHeight = DEFAULT_MIN_HEIGHT,
  style,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / poiFillDurationMs);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [poiFillDurationMs]);

  return (
    <MatericEventCard
      variant="reminder"
      title={title}
      daysLeftLabel={daysLeftLabel}
      image={
        <PoiMatericV3
          type="event"
          state="active"
          progress={progress}
          timerDirection="counterclockwise"
          size={poiSize}
        />
      }
      style={{
        maxWidth: width,
        width,
        minHeight,
        display: 'flex',
        justifyContent: 'center',
        ...style,
      }}
    />
  );
};

export default ReminderComponent;
