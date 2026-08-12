import { atmosphereAssets } from '../config/atmosphereAssets';

export interface WorldSurfaceFoamProps {
  enabled?: boolean;
  canvasSize: { width: number; height: number };
  zIndex: number;
}

/**
 * Animated foam layer along the coastline.
 *
 * The foam texture scrolls horizontally with a pulsing opacity, creating the
 * impression of breaking waves. The mask limits it to the sea layer below.
 */
export function WorldSurfaceFoam({ enabled = true, canvasSize, zIndex }: WorldSurfaceFoamProps) {
  if (!enabled) return null;

  const cfg = atmosphereAssets.foam;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
        // Confines the foam to the coastline. The mask is a full-canvas image in
        // the same 4240x2828 world space as this container, so it is stretched to
        // exactly 100%/100% rather than `cover`, which would crop it.
        // It is static, so the browser rasterises it once and only the children
        // animate inside it — the per-frame cost is plain alpha compositing.
        maskImage: 'url(/assets/atmosphere/foam/foam_mask.webp)',
        WebkitMaskImage: 'url(/assets/atmosphere/foam/foam_mask.webp)',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskPosition: '0 0',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    >
      <style>{`
        @keyframes wsFoamDrift {
          from { transform: translateX(0); }
          to   { transform: translateX(var(--ws-foam-period)); }
        }
        @keyframes wsFoamPulse {
          0%, 100% { opacity: var(--ws-foam-min); }
          50% { opacity: var(--ws-foam-max); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-foam { animation: none !important; }
        }
      `}</style>

      <div
        className="ws-foam"
        style={{
          position: 'absolute',
          top: 0,
          // The sheet is one tile wider than the canvas and starts one tile to the
          // left, because the drift animation slides it right by exactly one tile
          // before looping. Without the overhang that slide would drag the sheet's
          // left edge into view and leave an uncovered strip.
          left: -cfg.tileWorldPx,
          width: `calc(100% + ${cfg.tileWorldPx}px)`,
          height: '100%',
          backgroundImage: `url(/assets/atmosphere/${cfg.texture})`,
          backgroundSize: `${cfg.tileWorldPx}px ${cfg.tileWorldPx}px`,
          // Coastline runs along every edge of the map, not just the horizon, so
          // the texture has to tile on both axes.
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0',
          willChange: 'transform, opacity',
          ['--ws-foam-period' as string]: `${cfg.tileWorldPx}px`,
          ['--ws-foam-min' as string]: cfg.opacityMin,
          ['--ws-foam-max' as string]: cfg.opacityMax,
          animationName: 'wsFoamDrift, wsFoamPulse',
          animationDuration: `${cfg.driftSeconds}s, ${cfg.pulsePeriod}s`,
          animationTimingFunction: 'linear, ease-in-out',
          animationIterationCount: 'infinite, infinite',
        }}
      />
    </div>
  );
}

export default WorldSurfaceFoam;
