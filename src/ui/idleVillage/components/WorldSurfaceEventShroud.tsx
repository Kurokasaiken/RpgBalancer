/**
 * WorldSurfaceEventShroud — two-sided parchment curtain wipe.
 *
 * Uses the two pre-authored parchment-cloud halves extracted from
 * assets-source/tenda nuvole.psd. Each half slides in from its own edge,
 * meets in the middle and fully occludes the map. Both halves live in the
 * same compositing layer as the map: below the carved frame and below the
 * debug UI.
 */

import React from 'react';
import type { CSSProperties } from 'react';
import '@/ui/idleVillage/trailer/trailer.css';

export interface WorldSurfaceEventShroudProps {
  /** Whether the parchment curtains have closed over the map. */
  covered: boolean;
  /** Z-index at which the shroud sits: below the frame and debug UI, above the map. */
  zIndex: number;
}

/**
 * Renders the left/right parchment curtain halves.
 *
 * The halves are sized wider than 50% so they overlap in the centre, ensuring
 * no seam. They animate with CSS transforms only (compositor-friendly).
 */
export const WorldSurfaceEventShroud: React.FC<WorldSurfaceEventShroudProps> = ({
  covered,
  zIndex,
}) => {
  const shroudStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex,
    overflow: 'hidden',
    pointerEvents: 'none',
  };

  return (
    <div className="ws-event-shroud" style={shroudStyle} aria-hidden="true">
      <div
        className={`ws-event-shroud__half ws-event-shroud__half--left ${covered ? 'ws-event-shroud__half--closed' : ''}`}
      >
        <img
          src="/assets/world/wanderlust/base/layers/event_shroud_left.png"
          alt=""
          className="ws-event-shroud__image"
        />
      </div>
      <div
        className={`ws-event-shroud__half ws-event-shroud__half--right ${covered ? 'ws-event-shroud__half--closed' : ''}`}
      >
        <img
          src="/assets/world/wanderlust/base/layers/event_shroud_right.png"
          alt=""
          className="ws-event-shroud__image"
        />
      </div>
    </div>
  );
};

export default WorldSurfaceEventShroud;
