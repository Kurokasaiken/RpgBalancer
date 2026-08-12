import { atmosphereAssets } from '../config/atmosphereAssets';

export interface WorldSurfaceBirdsProps {
  enabled?: boolean;
  zIndex: number;
}

/**
 * Flocks taking off from the land.
 *
 * Each flight is an event, not a loop: a group lifts off from a point inland,
 * climbs away diagonally for about a second, and is gone for the rest of the minute.
 * `DESIGN_PILLARS.md` puts ambient life at "80% calma, 15% comunicazione ambientale,
 * 5% sorprese rare" and names "stormo" among the rare ones — birds permanently
 * crossing the screen are the opposite of that, and read as insects on the monitor.
 *
 * The silence is not scheduled in JavaScript. Each flight owns a keyframe track
 * whose flight is compressed into the opening percent of a long cycle, and the rest
 * of the track holds the birds where they left, transparent. No timer, no state, no
 * per-frame work — and it comes back on its own.
 *
 * Take-off points are sampled from the landmass in `build-terrain-masks.mjs`, so a
 * flock always leaves from ground rather than from open water or off-screen.
 */
export function WorldSurfaceBirds({ enabled = true, zIndex }: WorldSurfaceBirdsProps) {
  if (!enabled) return null;

  const cfg = atmosphereAssets.birds;
  if (!cfg || cfg.flights.length === 0) return null;

  // Emitted per flight because the flight window is a config value and a keyframe
  // selector cannot be a CSS variable. Transform is restated at every keyframe:
  // listing it only at the ends would let the intermediate opacity stops split the
  // interpolation and re-apply the easing inside the climb.
  const keyframes = cfg.flights
    .map((flight) => {
      const span = Math.min(99, Math.max(0.5, (flight.flightSeconds / flight.cycleSeconds) * 100));
      const at = (fraction: number) =>
        `translate3d(calc(var(--ws-bird-dx) * ${fraction}), calc(var(--ws-bird-dy) * ${fraction}), 0)`;
      return `
        @keyframes wsBirdFlight_${flight.name} {
          0% { transform: ${at(0)}; opacity: 0; }
          ${(span * 0.12).toFixed(3)}% { transform: ${at(0.12)}; opacity: var(--ws-bird-opacity); }
          ${(span * 0.7).toFixed(3)}% { transform: ${at(0.7)}; opacity: var(--ws-bird-opacity); }
          ${span.toFixed(3)}% { transform: ${at(1)}; opacity: 0; }
          100% { transform: ${at(1)}; opacity: 0; }
        }`;
    })
    .join('\n');

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        ${keyframes}
        @keyframes wsBirdFlap {
          from { background-position-x: 0; }
          to   { background-position-x: var(--ws-bird-strip); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-bird { animation: none !important; opacity: 0 !important; }
          .ws-bird-inner { animation: none !important; }
        }
      `}</style>

      {cfg.flights.map((flight) =>
        flight.birds.map((bird, index) => (
          <div
            key={`${flight.name}-${index}`}
            className="ws-bird"
            style={{
              position: 'absolute',
              left: flight.originX + bird.offsetX,
              top: flight.originY + bird.offsetY,
              width: bird.width,
              height: bird.height,
              // The track opens and closes transparent, so this only covers the
              // state before the animation's first frame applies.
              opacity: 0,
              willChange: 'transform, opacity',
              ['--ws-bird-dx' as string]: `${flight.dx}px`,
              ['--ws-bird-dy' as string]: `${flight.dy}px`,
              ['--ws-bird-opacity' as string]: flight.opacity,
              animationName: `wsBirdFlight_${flight.name}`,
              animationDuration: `${flight.cycleSeconds}s`,
              // Fast off the ground, easing as the flock settles into the climb.
              animationTimingFunction: 'ease-out',
              animationIterationCount: 'infinite',
              // Positive part staggers the formation so the group unfolds instead of
              // leaving as a rigid block; the negative part offsets the whole flight
              // so the three of them do not all fire at once on load.
              animationDelay: `${(bird.delayFraction * flight.flightSeconds - flight.startDelaySeconds).toFixed(2)}s`,
            }}
          >
            <div
              className="ws-bird-inner"
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(/assets/atmosphere/${cfg.strip})`,
                // One cell fills the element; the strip is frameCount cells wide.
                backgroundSize: `${bird.width * cfg.frameCount}px ${bird.height}px`,
                backgroundRepeat: 'no-repeat',
                transform: flight.flip ? 'scaleX(-1)' : undefined,
                willChange: 'background-position',
                ['--ws-bird-strip' as string]: `${-bird.width * cfg.frameCount}px`,
                animationName: 'wsBirdFlap',
                animationDuration: `${flight.flapSeconds}s`,
                animationTimingFunction: `steps(${cfg.frameCount})`,
                animationIterationCount: 'infinite',
              }}
            />
          </div>
        )),
      )}
    </div>
  );
}

export default WorldSurfaceBirds;
