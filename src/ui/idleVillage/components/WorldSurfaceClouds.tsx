import { atmosphereAssets } from '../config/atmosphereAssets';

export interface WorldSurfaceCloudsProps {
  enabled?: boolean;
  /** World canvas size, in world px. */
  canvasSize: { width: number; height: number };
  /**
   * Stacking order. Must be above every terrain layer: those carry explicit
   * z-index values, and a positioned element with z-index >= 1 paints over one
   * with `auto` no matter what the DOM order is — so leaving this unset makes the
   * clouds render behind the map even as the last child.
   */
  zIndex: number;
  /** Per-band width multipliers. */
  scales?: { far: number; mid: number; near: number };
  /**
   * Extra offset in WORLD px, on top of the camera's own pan — the parallax.
   *
   * Applied to this container rather than to the sprites, because each sprite is
   * already running a `transform` animation for its drift and an element has only
   * one transform.
   */
  parallaxOffset?: { x: number; y: number };
}

/**
 * Drifting cloud layer.
 *
 * Each sprite is an independent <img> translated by a CSS animation, so the drift
 * runs on the compositor and costs no JavaScript per frame. An earlier version
 * advanced a React `elapsedSeconds` state every rAF tick and re-rendered the whole
 * map — 21 full-canvas layers — which is what pushed p95 frame time past 300 ms.
 *
 * Depth comes from the band config: far clouds are smaller, slower and fainter
 * than near ones. All three bands sit under the terrain layers, so the map reads
 * as seen from above the weather, not through it.
 */
export function WorldSurfaceClouds({
  enabled = true,
  canvasSize,
  zIndex,
  scales = { far: 1, mid: 1, near: 1 },
  parallaxOffset,
}: WorldSurfaceCloudsProps) {
  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        // Clouds must not spill outside the map while crossing it.
        overflow: 'hidden',
        pointerEvents: 'none',
        transform: `translate3d(calc(${(parallaxOffset?.x ?? 0)}px + var(--ws-mouse-parallax-x, 0px)), calc(${(parallaxOffset?.y ?? 0)}px + var(--ws-mouse-parallax-y, 0px)), 0)`,
        // The plan's 400ms ease-out. During a drag this is what makes the band
        // trail the map instead of moving in lockstep with it, which is the whole
        // effect: without the lag there is no parallax to see, only a band that
        // happens to sit slightly off.
        transition: 'transform 400ms ease-out',
        willChange: 'transform',
      }}
    >
      <style>{`
        @keyframes wsCloudDrift {
          from { transform: translate3d(var(--ws-cloud-from), 0, 0); }
          to   { transform: translate3d(var(--ws-cloud-to), 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-cloud { animation: none !important; }
        }
      `}</style>

      {atmosphereAssets.clouds.map((band) =>
        band.sprites.map((sprite) => (
          <img
            key={`${band.name}-${sprite.src}-${sprite.y}`}
            className="ws-cloud"
            src={`/assets/atmosphere/${sprite.src}`}
            alt=""
            style={{
              position: 'absolute',
              top: sprite.y,
              left: 0,
              width: sprite.width * band.scale * scales[band.name],
              height: 'auto',
              opacity: band.opacity,
              willChange: 'transform',
              // Travel a full canvas width plus the sprite's own width, so it is
              // fully off one edge before reappearing at the other.
              ['--ws-cloud-from' as string]: `${-sprite.width * band.scale * scales[band.name]}px`,
              ['--ws-cloud-to' as string]: `${canvasSize.width}px`,
              animationName: 'wsCloudDrift',
              animationDuration: `${band.driftSeconds}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              // Negative delay starts each sprite partway through its crossing,
              // so the band is spread out from the first frame instead of
              // entering as a clump.
              animationDelay: `${-sprite.delaySeconds}s`,
            }}
          />
        )),
      )}
    </div>
  );
}

export default WorldSurfaceClouds;
