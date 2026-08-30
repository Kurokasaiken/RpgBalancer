import { atmosphereAssets } from '../config/atmosphereAssets';

export interface WorldSurfaceWaterFieldProps {
  enabled?: boolean;
  canvasSize: { width: number; height: number };
  zIndex: number;
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
export function WorldSurfaceWaterField({ enabled = true, canvasSize, zIndex }: WorldSurfaceWaterFieldProps) {
  if (!enabled) return null;

  const cfg = atmosphereAssets.waterField;
  if (!cfg || cfg.layers.length === 0) return null;

  return (
    <div
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
        @media (prefers-reduced-motion: reduce) {
          .ws-water-x, .ws-water-y { animation: none !important; }
        }
      `}</style>

      {cfg.layers.map((layer) => {
        // The tiled plane overhangs the canvas by one tile on every side, so a
        // translation of a whole tile in either axis never pulls an edge into view.
        const pad = layer.tilePx;
        return (
          <div
            key={layer.name}
            className="ws-water-x"
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
