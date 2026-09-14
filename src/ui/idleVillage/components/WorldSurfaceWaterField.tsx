import { useEffect, useRef } from 'react';
import { atmosphereAssets } from '../config/atmosphereAssets';
import type { WaterFieldConfig } from '../config/atmosphereAssets';

/**
 * The sea's own mean colour, measured over the opaque pixels of the sea layer well
 * away from its edges: rgb(110, 136, 141), luminance p10-p90 of 112-150. Shifting
 * it a few points keeps every pool inside the tonal range the painting already
 * uses, which is what makes them read as the water's own light rather than as a
 * coloured wash laid over it.
 */
function seaTint(delta: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + delta)));
  return `rgb(${c(110)}, ${c(136)}, ${c(141)})`;
}

export interface WorldSurfaceWaterFieldProps {
  enabled?: boolean;
  canvasSize: { width: number; height: number };
  zIndex: number;
  /**
   * Optional water-field config. When omitted, `atmosphereAssets.waterField` is used.
   * The lab page uses this to compare intensified variants without mutating the global config.
   */
  config?: WaterFieldConfig;
}

/**
 * The sea's micro-detail field — the layer that makes the water read as a surface
 * rather than as a painting of one.
 *
 * Every other atmosphere layer here is *object* motion: a ship crosses, birds take
 * off, a cloud drifts. Each is a strong signal inside a small region, and each
 * leaves the rest of the scene temporally identical frame to frame. The eye
 * segments that instantly into "static background, moving object", and the
 * background stays classified as static no matter how many objects are added. What
 * was missing is *surface* motion: correlated, simultaneous, low-amplitude change
 * spread across a large area.
 *
 * The sea is the largest continuous surface on the map, and until now it was
 * pixel-identical from one frame to the next.
 *
 * Two detail tiles drift across it in diverging directions at different speeds.
 * The painting underneath never moves — the direction pillar rules out translating
 * the 4240x2828 layers, and it would expose empty edges anyway.
 *
 * Why this works where the Pixi DisplacementFilter did not: displacement moves
 * pixels, and the painted sea carries almost no high-frequency detail to move
 * (measured at ~1% of dynamic range after subtracting a 3px blur). These tiles
 * supply the detail instead of trying to extract it from a surface that has none.
 * See `scripts/build-water-detail.mjs`.
 *
 * Three details that are load-bearing, not decoration:
 *
 * Asymmetric speeds. The two layers are not +v/-v. Symmetric speeds make the
 * combined pattern's beat frequency obvious within 10-15 seconds; different speeds,
 * different tile sizes and non-orthogonal directions push the apparent repeat far
 * enough out that it never announces itself.
 *
 * Nested axis loops. Each layer scrolls diagonally, but a repeating background is
 * only exactly seamless when it translates by a whole tile. Rather than travel a
 * long diagonal to land on a whole tile in both axes at once, the X and Y loops run
 * on separate nested elements with independent periods. Each is individually
 * seamless, and the pair beats against itself over a much longer cycle than either.
 *
 * Sub-perceptual opacity. Around 0.03. If the pattern is legible as a pattern it
 * has already failed: the target is that the painting looks like it is moving, not
 * that something is moving on top of the painting.
 */
export function WorldSurfaceWaterField({ enabled = true, canvasSize, zIndex, config }: WorldSurfaceWaterFieldProps) {
  if (!enabled) return null;

  const cfg = config ?? atmosphereAssets.waterField;
  if (!cfg || cfg.layers.length === 0) return null;

  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);

  // Drive animation with setInterval so it keeps running even when hidden
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const fps = 30;
    const dtMs = 1000 / fps;
    const interval = setInterval(() => {
      timeRef.current += dtMs;

      // Animate detail tiles
      cfg.layers.forEach((layer, idx) => {
        const el = container.querySelector(`.ws-water-x[data-layer="${idx}"]`) as HTMLElement | null;
        const yEl = el?.querySelector('.ws-water-y') as HTMLElement | null;
        if (!el || !yEl) return;

        const xProgress = (timeRef.current / (layer.periodXSeconds * 1000)) % 1;
        const yProgress = (timeRef.current / (layer.periodYSeconds * 1000)) % 1;

        el.style.transform = `translate3d(${layer.stepX * xProgress}px, 0, 0)`;
        yEl.style.transform = `translate3d(0, ${layer.stepY * yProgress}px, 0)`;
      });

      // Animate light pools
      cfg.lightPools.forEach((pool, idx) => {
        const el = container.querySelector(`.ws-water-pool[data-pool="${idx}"]`) as HTMLElement | null;
        const innerEl = el?.querySelector('div') as HTMLElement | null;
        if (!el || !innerEl) return;

        const progress = (timeRef.current / (pool.driftSeconds * 1000)) % 1;
        const driftProgress = progress < 0.5 ? progress * 2 : 2 - progress * 2;
        const x = pool.dx * driftProgress;
        const y = pool.dy * driftProgress;

        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        const pulseProgress = Math.abs(Math.sin(Math.PI * ((timeRef.current / (pool.pulseSeconds * 1000)) % 1)));
        innerEl.style.opacity = String(pool.opacityMin + (pool.opacityMax - pool.opacityMin) * pulseProgress);
      });
    }, dtMs);

    return () => clearInterval(interval);
  }, [cfg]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
        // Confines the field to the water. The mask is a full-canvas image in the
        // same world space, so it stretches to exactly 100%/100% rather than
        // `cover`, which would crop it. It is static, so it rasterises once and
        // only the children animate underneath.
        maskImage: 'url(/assets/atmosphere/terrain/sea_mask.webp)',
        WebkitMaskImage: 'url(/assets/atmosphere/terrain/sea_mask.webp)',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        maskPosition: '0 0',
        WebkitMaskPosition: '0 0',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    >
      <style>{`
        @keyframes wsWaterDriftX {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(var(--ws-water-dx), 0, 0); }
        }
        @keyframes wsWaterDriftY {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(0, var(--ws-water-dy), 0); }
        }
        @keyframes wsWaterPoolDrift {
          0%   { transform: translate3d(0, 0, 0); }
          50%  { transform: translate3d(var(--ws-pool-dx), var(--ws-pool-dy), 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes wsWaterPoolPulse {
          0%, 100% { opacity: var(--ws-pool-min); }
          50%      { opacity: var(--ws-pool-max); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-water-x, .ws-water-y, .ws-water-pool, .ws-water-pool > div { animation: none !important; }
        }
      `}</style>

      {/* The light pools go under the detail tiles: the strokes are highlights ON
          the water, so they should not be dimmed by a shadow passing over them. */}
      {cfg.lightPools.map((pool, idx) => {
        const tint = seaTint(pool.tintDelta);
        return (
          <div
            key={pool.name}
            className="ws-water-pool"
            data-pool={idx}
            style={{
              position: 'absolute',
              left: pool.x - pool.sizePx / 2,
              top: pool.y - pool.sizePx / 2,
              width: pool.sizePx,
              height: pool.sizePx,
              willChange: 'transform',
              ['--ws-pool-dx' as string]: `${pool.dx}px`,
              ['--ws-pool-dy' as string]: `${pool.dy}px`,
              animationName: 'wsWaterPoolDrift',
              animationDuration: `${pool.driftSeconds}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                // No hard stop anywhere in the ramp: the pool must never resolve
                // into an edge the eye can find.
                background: `radial-gradient(circle, ${tint} 0%, ${tint} 18%, transparent 72%)`,
                willChange: 'opacity',
                ['--ws-pool-min' as string]: pool.opacityMin,
                ['--ws-pool-max' as string]: pool.opacityMax,
                animationName: 'wsWaterPoolPulse',
                animationDuration: `${pool.pulseSeconds}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
              }}
            />
          </div>
        );
      })}

      {cfg.layers.map((layer, idx) => {
        // The tiled plane overhangs the canvas by one tile on every side, so a
        // translation of a whole tile in either axis never pulls an edge into view.
        const pad = layer.tilePx;
        return (
          <div
            key={layer.name}
            className="ws-water-x"
            data-layer={idx}
            style={{
              position: 'absolute',
              left: -pad,
              top: -pad,
              width: canvasSize.width + pad * 2,
              height: canvasSize.height + pad * 2,
              willChange: 'transform',
              ['--ws-water-dx' as string]: `${layer.stepX}px`,
              animationName: 'wsWaterDriftX',
              animationDuration: `${layer.periodXSeconds}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          >
            <div
              className="ws-water-y"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(/assets/atmosphere/${layer.src})`,
                backgroundRepeat: 'repeat',
                backgroundSize: `${layer.tilePx}px ${layer.tilePx}px`,
                opacity: layer.opacity,
                willChange: 'transform',
                ['--ws-water-dy' as string]: `${layer.stepY}px`,
                animationName: 'wsWaterDriftY',
                animationDuration: `${layer.periodYSeconds}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default WorldSurfaceWaterField;
