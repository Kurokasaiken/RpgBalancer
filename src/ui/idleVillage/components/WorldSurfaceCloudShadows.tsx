import { atmosphereAssets } from '../config/atmosphereAssets';

export interface WorldSurfaceCloudShadowsProps {
  enabled?: boolean;
  canvasSize: { width: number; height: number };
  zIndex: number;
  /** Per-band width multipliers. */
  scales?: { far: number; mid: number; near: number };
  /**
   * Extra offset in WORLD px, on top of the camera's own pan — the parallax.
   * Mouse parallax is layered in via CSS custom properties from the parent.
   */
  parallaxOffset?: { x: number; y: number };
}

/**
 * Cloud shadow layer (direction C).
 *
 * Shadows of drifting clouds cross the landscape below, creating the impression
 * of moving weather without obscuring the map. The shadows are semi-transparent
 * and follow the same drift pattern as their parent clouds, offset by depth.
 */
export function WorldSurfaceCloudShadows({
  enabled = true,
  canvasSize,
  zIndex,
  scales = { far: 1, mid: 1, near: 1 },
  parallaxOffset,
}: WorldSurfaceCloudShadowsProps) {
  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
        transform: `translate3d(calc(${(parallaxOffset?.x ?? 0)}px + var(--ws-mouse-parallax-x, 0px)), calc(${(parallaxOffset?.y ?? 0)}px + var(--ws-mouse-parallax-y, 0px)), 0)`,
        transition: 'transform 400ms ease-out',
        willChange: 'transform',
        maskImage: 'url(/assets/atmosphere/terrain/cloud_mask_land.png)',
        WebkitMaskImage: 'url(/assets/atmosphere/terrain/cloud_mask_land.png)',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    >
      <style>{`
        @keyframes wsCloudShadowDrift {
          from { transform: translate3d(var(--ws-shadow-from), 0, 0); }
          to   { transform: translate3d(var(--ws-shadow-to), 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-cloud-shadow { animation: none !important; }
        }
      `}</style>

      {atmosphereAssets.clouds.map((band) =>
        band.sprites.map((sprite) => (
          <img
            key={`shadow-${band.name}-${sprite.shadowSrc}-${sprite.y}`}
            className="ws-cloud-shadow"
            src={`/assets/atmosphere/${sprite.shadowSrc}`}
            alt=""
            style={{
              position: 'absolute',
              top: sprite.y,
              left: 0,
              width: sprite.width * band.scale * scales[band.name],
              height: 'auto',
              mixBlendMode: 'multiply',
              opacity: band.shadowOpacity,
              ['--ws-shadow-from' as string]: `${-sprite.width * band.scale * scales[band.name]}px`,
              willChange: 'transform',
              ['--ws-shadow-to' as string]: `${canvasSize.width}px`,
              animationName: 'wsCloudShadowDrift',
              animationDuration: `${band.driftSeconds}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: `${-sprite.delaySeconds}s`,
            }}
          />
        )),
      )}
    </div>
  );
}

export default WorldSurfaceCloudShadows;
