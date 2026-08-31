import React from 'react';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';

export interface WorldSurfaceRiverGlintProps {
  /** Full size of the world canvas. */
  canvasSize: { width: number; height: number };
  /** Stack position relative to the cloud layer. */
  zIndex: number;
}

/**
 * `WorldSurfaceRiverGlint` — slow animated light streaks drawn along the painted rivers.
 *
 * It is an SVG overlay with `stroke-dashoffset` animation, so it costs almost nothing.
 * The paths live in `atmosphereAssets.riverGlints` and are tuned to the map artwork.
 */
export const WorldSurfaceRiverGlint: React.FC<WorldSurfaceRiverGlintProps> = ({
  canvasSize,
  zIndex,
}) => {
  const { riverGlints } = atmosphereAssets;
  if (riverGlints.length === 0) return null;

  const offset = (g: { dash: number; gap: number }) => -(g.dash + g.gap);

  return (
    <svg
      viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex,
        overflow: 'visible',
      }}
    >
      <style>{`
        @keyframes ws-river-glint {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: var(--ws-glint-offset); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-river-glint { animation: none !important; }
        }
      `}</style>
      {riverGlints.map((g, i) => (
        <path
          key={`river-glint-${i}`}
          d={g.d}
          fill="none"
          stroke={g.color}
          strokeWidth={g.width}
          strokeLinecap="round"
          strokeDasharray={`${g.dash} ${g.gap}`}
          opacity={g.opacity}
          className="ws-river-glint"
          style={{
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ['--ws-glint-offset' as string]: `${offset(g)}`,
            animation: `ws-river-glint ${g.durationSeconds}s linear infinite`,
            animationDelay: `${g.delaySeconds ?? 0}s`,
          }}
        />
      ))}
    </svg>
  );
};
