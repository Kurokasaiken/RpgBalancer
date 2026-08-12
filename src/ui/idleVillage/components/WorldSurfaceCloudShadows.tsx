import { atmosphereAssets } from '../config/atmosphereAssets';

export interface WorldSurfaceCloudShadowsProps {
  enabled?: boolean;
  canvasSize: { width: number; height: number };
  zIndex: number;
}

/**
 * Cloud shadow layer (direction C).
 *
 * Shadows of drifting clouds cross the landscape below, creating the impression
 * of moving weather without obscuring the map. The shadows are semi-transparent
 * and follow the same drift pattern as their parent clouds, offset by depth.
 */
export function WorldSurfaceCloudShadows({ enabled = true, canvasSize, zIndex }: WorldSurfaceCloudShadowsProps) {
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
              width: sprite.width,
              height: 'auto',
              opacity: band.shadowOpacity,
              willChange: 'transform',
              ['--ws-shadow-from' as string]: `${-sprite.width}px`,
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
