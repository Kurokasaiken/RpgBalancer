/**
 * @trailer-only
 *
 * TrailerParchmentClouds — full-screen parchment-colored cloud cover.
 *
 * A trailer-only layer that pulls the existing atmosphere cloud assets,
 * tints them to parchment, and stacks many copies to fully blanket the
 * screen. The cover moves in from both sides like two closing walls:
 * left wall drifts right, right wall drifts left. Clear reverses the
 * motion back to both edges.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 */

import React, { useEffect, useMemo, useState } from 'react';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';
import { trailerRandom } from '@/balancing/config/idleVillage/trailerConfig';

export interface TrailerParchmentCloudsProps {
  /** When true, clouds close in from both sides. When false, they open. */
  active: boolean;
}

type CloudSide = 'left' | 'right';

interface ParchmentCloudSprite {
  id: string;
  src: string;
  side: CloudSide;
  width: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  layer: number;
}

/**
 * Renders a thick, two-wall parchment cloud blanket.
 *
 * Half the sprites form the left wall, half the right wall. Sizes and
 * vertical positions are randomized so the overlap is dense and organic.
 * Positions and timing are deterministic through trailerRandom.
 */
export const TrailerParchmentClouds: React.FC<TrailerParchmentCloudsProps> = ({
  active,
}) => {
  const [hasBeenActive, setHasBeenActive] = useState(active);

  useEffect(() => {
    if (active) setHasBeenActive(true);
  }, [active]);

  const sprites = useMemo<ParchmentCloudSprite[]>(() => {
    const out: ParchmentCloudSprite[] = [];
    let id = 0;
    atmosphereAssets.clouds.forEach((band) => {
      // Stack many copies of each band sprite for dense overlap.
      for (let copy = 0; copy < 8; copy += 1) {
        band.sprites.forEach((sprite) => {
          const side: CloudSide = trailerRandom.next() > 0.5 ? 'right' : 'left';
          out.push({
            id: `parchment-cloud-${id++}`,
            src: `/assets/atmosphere/${sprite.src}`,
            side,
            width: 25 + trailerRandom.next() * 55,
            top: trailerRandom.range(0, 95),
            left:
              side === 'left'
                ? trailerRandom.next() * 40
                : 60 + trailerRandom.next() * 35,
            delay: trailerRandom.next() * 0.5,
            duration: 0.9 + trailerRandom.next() * 0.8,
            layer: out.length,
          });
        });
      }
    });
    return out;
  }, []);

  return (
    <div className="trailer-parchment-clouds">
      {sprites.map((sprite) => {
        const animationName = active
          ? `trailer-parchment-cloud-cover-${sprite.side}`
          : hasBeenActive
            ? `trailer-parchment-cloud-clear-${sprite.side}`
            : 'none';

        return (
          <img
            key={sprite.id}
            src={sprite.src}
            alt=""
            className={`trailer-parchment-cloud trailer-parchment-cloud--${sprite.side}`}
            style={{
              width: `${sprite.width}vw`,
              top: `${sprite.top}vh`,
              left: `${sprite.left}vw`,
              zIndex: 100 + sprite.layer,
              animationName,
              animationDelay: `${sprite.delay}s`,
              animationDuration: `${sprite.duration}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default TrailerParchmentClouds;
