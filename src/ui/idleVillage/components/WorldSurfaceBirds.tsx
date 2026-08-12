import { atmosphereAssets } from '../config/atmosphereAssets';

export interface WorldSurfaceBirdsProps {
  enabled?: boolean;
  /** World canvas size, in world px. */
  canvasSize: { width: number; height: number };
  zIndex: number;
}

/**
 * Birds, as a rare passing event rather than a loop.
 *
 * A flock crosses during the opening tenth of its cycle and the sky is empty for the
 * rest. The gap is not scheduled in JavaScript: each flock gets its own keyframe
 * track whose crossing is compressed into the first `crossFraction` of the timeline,
 * with the remainder holding the birds offscreen and transparent. No timer, no
 * state, no per-frame work — and the pass returns on its own.
 *
 * A continuous stream of birds was the previous behaviour and it read as insects on
 * the screen: motion that catches the eye before the player has found anything on
 * the map is motion that is failing.
 *
 * Three tracks run per bird: the outer element carries the horizontal pass and the
 * fade, the inner element drifts vertically so the path bends into an arc, and the
 * inner background steps through the wing-flap strip. Only the last repaints, over a
 * few dozen screen pixels, and only while the bird is visible.
 */
export function WorldSurfaceBirds({ enabled = true, canvasSize, zIndex }: WorldSurfaceBirdsProps) {
  if (!enabled) return null;

  const cfg = atmosphereAssets.birds;
  if (!cfg || cfg.flocks.length === 0) return null;

  // Keyframes are emitted per flock because the crossing window is a config value and
  // a keyframe selector cannot be a CSS variable.
  const keyframes = cfg.flocks
    .map((flock) => {
      const cross = Math.min(99, Math.max(1, flock.crossFraction * 100));
      const fadeIn = (cross * 0.12).toFixed(2);
      const fadeOut = (cross * 0.88).toFixed(2);
      return `
        @keyframes wsBirdPass_${flock.name} {
          0% { transform: translate3d(var(--ws-bird-from), 0, 0); opacity: 0; }
          ${fadeIn}% { opacity: var(--ws-bird-opacity); }
          ${fadeOut}% { opacity: var(--ws-bird-opacity); }
          ${cross}% { transform: translate3d(var(--ws-bird-to), 0, 0); opacity: 0; }
          100% { transform: translate3d(var(--ws-bird-to), 0, 0); opacity: 0; }
        }
        @keyframes wsBirdRise_${flock.name} {
          0% { transform: translate3d(0, 0, 0); }
          ${cross}% { transform: translate3d(0, var(--ws-bird-rise), 0); }
          100% { transform: translate3d(0, var(--ws-bird-rise), 0); }
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
          .ws-bird, .ws-bird-inner { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      {cfg.flocks.map((flock) =>
        flock.birds.map((bird) => (
          <div
            key={`${flock.name}-${bird.y}-${bird.delaySeconds}`}
            className="ws-bird"
            style={{
              position: 'absolute',
              top: bird.y,
              left: 0,
              width: bird.width,
              height: bird.height,
              // The track starts and ends transparent, so this is only the state
              // before the animation's first frame is applied.
              opacity: 0,
              willChange: 'transform, opacity',
              ['--ws-bird-from' as string]: `${-bird.width}px`,
              ['--ws-bird-to' as string]: `${canvasSize.width}px`,
              ['--ws-bird-opacity' as string]: flock.opacity,
              animationName: `wsBirdPass_${flock.name}`,
              animationDuration: `${flock.cycleSeconds}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              // Negative delay staggers the flock across the cycle, so the passes do
              // not all happen at once and then leave a long shared silence.
              animationDelay: `${-bird.delaySeconds}s`,
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
                willChange: 'transform',
                ['--ws-bird-rise' as string]: `${flock.riseWorldPx}px`,
                ['--ws-bird-strip' as string]: `${-bird.width * cfg.frameCount}px`,
                animationName: `wsBirdRise_${flock.name}, wsBirdFlap`,
                animationDuration: `${flock.cycleSeconds}s, ${flock.flapSeconds}s`,
                animationTimingFunction: `ease-in-out, steps(${cfg.frameCount})`,
                animationIterationCount: 'infinite, infinite',
                animationDelay: `${-bird.delaySeconds}s, 0s`,
              }}
            />
          </div>
        )),
      )}
    </div>
  );
}

export default WorldSurfaceBirds;
