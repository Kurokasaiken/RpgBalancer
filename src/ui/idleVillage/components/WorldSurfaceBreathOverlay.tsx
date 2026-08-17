import { useMemo } from 'react';

/** Props for the prototype breath overlay. */
interface WorldSurfaceBreathOverlayProps {
  /** World canvas size in pixels. */
  canvasSize: { width: number; height: number };
  /** Current mouse position in world coordinates, or null. */
  mouseWorld: { x: number; y: number } | null;
  /** Token journey origin. Defaults to the village area. */
  startPoint?: { x: number; y: number };
  /** Token journey destination. Defaults to a nearby river/forest area. */
  endPoint?: { x: number; y: number };
}

const RIVER_PATHS = [
  'M 1120,1380 C 1200,1450 1280,1420 1360,1500 S 1500,1680 1580,1720',
  'M 2020,1260 C 2100,1320 2180,1300 2260,1380 S 2400,1560 2480,1600',
  'M 3080,1660 C 3160,1720 3240,1700 3320,1780 S 3460,1960 3540,2000',
];

const GLINT_COLORS = ['#ffffff', '#e0f7fa', '#b2ebf2'];

const REVEAL_RADIUS = 180;
const REVEAL_FLOOR = 70;

/**
 * Breath mode prototype overlay.
 *
 * Renders experimental reactive effects on top of the world: river glints,
 * a traveling expedition token, a focused region, a discovery stroke and a
 * water-reveal window that follows the pointer. Intended for the World Surface
 * TestHub only, not as a frozen kit.
 */
export function WorldSurfaceBreathOverlay({
  canvasSize,
  mouseWorld,
  startPoint = { x: 1830, y: 1350 },
  endPoint = { x: 1120, y: 1380 },
}: WorldSurfaceBreathOverlayProps) {
  const tokenPath = useMemo(
    () => `M ${startPoint.x},${startPoint.y} C ${startPoint.x + 200},${startPoint.y - 120} ${endPoint.x - 200},${endPoint.y - 80} ${endPoint.x},${endPoint.y}`,
    [startPoint, endPoint],
  );

  const discoveryPath = useMemo(
    () => `M ${startPoint.x + 40},${startPoint.y + 40} L ${startPoint.x + 90},${startPoint.y + 80} L ${startPoint.x + 150},${startPoint.y + 60} L ${startPoint.x + 210},${startPoint.y + 100}`,
    [startPoint],
  );

  const focus = useMemo(
    () => ({
      x: startPoint.x - 80,
      y: startPoint.y - 60,
      width: 320,
      height: 240,
    }),
    [startPoint],
  );

  const waterReveal = mouseWorld ? {
    left: mouseWorld.x - REVEAL_RADIUS,
    top: mouseWorld.y - REVEAL_RADIUS,
    width: REVEAL_RADIUS * 2,
    height: REVEAL_RADIUS * 2,
  } : null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <style>{`
        @keyframes wsDiscoveryStroke {
          0% { stroke-dashoffset: 320; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes wsRegionPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.65; }
        }
        .ws-discovery {
          stroke-dasharray: 320;
          stroke-dashoffset: 320;
          animation: wsDiscoveryStroke 3s ease-out forwards;
        }
        .ws-region-focus {
          animation: wsRegionPulse 3s ease-in-out infinite;
        }
      `}</style>

      <svg
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <path id="ws-token-route" d={tokenPath} fill="none" />
        </defs>

        <g
          style={{
            maskImage: 'url(/assets/atmosphere/terrain/shallow_mask.webp)',
            WebkitMaskImage: 'url(/assets/atmosphere/terrain/shallow_mask.webp)',
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
          }}
        >
          {RIVER_PATHS.map((d, i) =>
            [0, 1.6, 3.3].map((delay) => (
              <circle
                key={`glint-${i}-${delay}`}
                r={4}
                fill={GLINT_COLORS[i % GLINT_COLORS.length]}
                opacity={0}
              >
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  path={d}
                  begin={`${delay}s`}
                  calcMode="linear"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.9;0.9;0"
                  keyTimes="0;0.1;0.9;1"
                  dur="5s"
                  repeatCount="indefinite"
                  begin={`${delay}s`}
                />
              </circle>
            )),
          )}
        </g>

        <rect
          x={focus.x}
          y={focus.y}
          width={focus.width}
          height={focus.height}
          rx={12}
          fill="rgba(251, 191, 36, 0.08)"
          stroke="rgba(251, 191, 36, 0.55)"
          strokeWidth={2}
          className="ws-region-focus"
        />

        <path
          d={discoveryPath}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={3}
          strokeLinecap="round"
          className="ws-discovery"
        />

        <g>
          <circle r={14} fill="#fbbf24">
            <animateMotion dur="8s" repeatCount="indefinite" path={tokenPath} />
          </circle>
          <circle r={18} fill="none" stroke="#fbbf24" strokeWidth={2} opacity={0.5}>
            <animateMotion dur="8s" repeatCount="indefinite" path={tokenPath} />
          </circle>
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-14}
            stroke="#fbbf24"
            strokeWidth={2}
          >
            <animateMotion dur="8s" repeatCount="indefinite" path={tokenPath} />
          </line>
        </g>
      </svg>

      {waterReveal && (
        <div
          style={{
            position: 'absolute',
            left: waterReveal.left,
            top: waterReveal.top,
            width: waterReveal.width,
            height: waterReveal.height,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(224, 247, 250, 0.35) 0%, rgba(224, 247, 250, 0.12) ${REVEAL_FLOOR}%, transparent 100%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
    </div>
  );
}

export default WorldSurfaceBreathOverlay;
