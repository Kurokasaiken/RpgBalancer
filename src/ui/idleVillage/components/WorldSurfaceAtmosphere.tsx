import React, { useMemo } from 'react';
import { atmosphereAssets } from '../config/atmosphereAssets';
import type { AmbientConfig } from '../config/atmosphereAssets';

export interface WorldSurfaceAtmosphereProps {
  canvasSize: { width: number; height: number };
  zIndex: number;
  /** Optional config override. Defaults to `atmosphereAssets.ambient`. */
  config?: AmbientConfig;
}

interface DustMote {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

/**
 * Generate a deterministic, evenly scattered field of dust motes in world space.
 *
 * The position sequence is a cheap jittered grid: a prime-step walk in X and Y
 * keeps motes from clustering, while the modulo guarantees they stay inside
 * the canvas without expensive collision checks.
 */
function generateDustMotes(
  count: number,
  width: number,
  height: number,
  sizeMin: number,
  sizeMax: number,
  driftMin: number,
  driftMax: number,
  opacityMin: number,
  opacityMax: number,
): DustMote[] {
  return Array.from({ length: count }, (_, i) => {
    const sizeRange = sizeMax - sizeMin + 1;
    const driftRange = driftMax - driftMin + 1;
    const size = sizeMin + ((i * 3) % sizeRange);
    const duration = driftMin + ((i * 7) % driftRange);
    const delay = (i * 0.31) % driftMax;
    const opacity = opacityMin + ((i % 10) / 10) * (opacityMax - opacityMin);
    return {
      id: i,
      x: (i * 17) % width,
      y: (i * 23) % height,
      size,
      duration,
      delay,
      opacity,
    };
  });
}

/**
 * Build a soft halo around the light origin.
 */
function haloGradient(color: string): string {
  return `radial-gradient(circle at var(--ws-light-origin-x, 80%) var(--ws-light-origin-y, 10%), ${color} 0%, transparent 45%)`;
}

/**
 * Build a repeating conic ray fan.
 *
 * The cycle is `width + spread` degrees: color 0..width, transparent width..cycle.
 * Repeating that fan around the origin gives the ray bundle.
 */
function rayGradient(color: string, angle: number, width: number, spread: number): string {
  const cycle = width + spread;
  return (
    `repeating-conic-gradient(` +
    `from ${angle}deg ` +
    `at var(--ws-light-origin-x, 80%) var(--ws-light-origin-y, 10%), ` +
    `transparent 0deg, ${color} 0deg, ${color} ${width}deg, ` +
    `transparent ${width}deg, transparent ${cycle}deg)`
  );
}

/**
 * Ambient atmospheric layer for the world surface: soft god rays and drifting dust.
 *
 * Everything is CSS/SVG-driven. No canvas, no per-frame JS, and the only motion
 * comes from CSS `transform`/`opacity` keyframes. `prefers-reduced-motion` silences
 * both layers so the map stays still for users who need it.
 *
 * Light rays sit above terrain but below clouds and birds, so they read as sky
 * rather than as paint laid over the land.
 */
export const WorldSurfaceAtmosphere: React.FC<WorldSurfaceAtmosphereProps> = ({
  canvasSize,
  zIndex,
  config,
}) => {
  const cfg = config ?? atmosphereAssets.ambient;
  if (!cfg.lightRays.enabled && !cfg.dust.enabled) return null;

  const dustMotes = useMemo(
    () =>
      generateDustMotes(
        cfg.dust.count,
        canvasSize.width,
        canvasSize.height,
        cfg.dust.sizeMin,
        cfg.dust.sizeMax,
        cfg.dust.driftSecondsMin,
        cfg.dust.driftSecondsMax,
        cfg.dust.opacityMin,
        cfg.dust.opacityMax,
      ),
    [cfg.dust, canvasSize.width, canvasSize.height],
  );

  const pulseMax = Math.min(1, cfg.lightRays.opacity * 1.25);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
        ['--ws-light-origin-x' as string]: cfg.lightRays.originX,
        ['--ws-light-origin-y' as string]: cfg.lightRays.originY,
      }}
    >
      <style>{`
        @keyframes wsLightPulse {
          0%, 100% { opacity: ${cfg.lightRays.opacity}; }
          50% { opacity: ${pulseMax}; }
        }
        @keyframes wsDustFloat {
          0% { transform: translate3d(0, 0, 0); opacity: var(--ws-dust-opacity-min); }
          100% { transform: translate3d(0, -24px, 0); opacity: var(--ws-dust-opacity-max); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-light-rays, .ws-dust-mote { animation: none !important; }
        }
      `}</style>

      {cfg.lightRays.enabled && (
        <div
          className="ws-light-rays"
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              ${haloGradient(cfg.lightRays.color)},
              ${rayGradient(
                cfg.lightRays.color,
                cfg.lightRays.angle,
                cfg.lightRays.width,
                cfg.lightRays.spread,
              )}
            `,
            backgroundBlendMode: 'screen',
            mixBlendMode: 'screen',
            opacity: cfg.lightRays.opacity,
            animation: `wsLightPulse ${cfg.lightRays.speedSeconds}s ease-in-out infinite alternate`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {cfg.dust.enabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {dustMotes.map((mote) => (
            <span
              key={mote.id}
              className="ws-dust-mote"
              style={{
                position: 'absolute',
                left: mote.x,
                top: mote.y,
                width: mote.size,
                height: mote.size,
                borderRadius: '50%',
                background: cfg.dust.color,
                opacity: 'var(--ws-dust-opacity-min)',
                ['--ws-dust-opacity-min' as string]: String(mote.opacity * 0.6),
                ['--ws-dust-opacity-max' as string]: String(mote.opacity),
                animation: `wsDustFloat ${mote.duration}s ease-in-out ${mote.delay}s infinite alternate`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorldSurfaceAtmosphere;
