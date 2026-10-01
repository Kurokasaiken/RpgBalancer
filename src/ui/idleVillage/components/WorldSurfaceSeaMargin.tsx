export interface WorldSurfaceSeaMarginProps {
  canvas: { width: number; height: number };
  /** Width of the extra sea on each side, in world px. */
  marginPx: number;
  /** Full-canvas layer images that make up the sea, bottom to top. */
  sources: string[];
}

/**
 * PLACEHOLDER sea beyond the left and right edges of the painted canvas, made by
 * mirroring the edge itself. A mirror is only believable while the strip it copies
 * is open water: on the Wanderlust map the land starts 266 px in from the sides, so
 * `marginPx` must stay under that. Past it the margin needs to be painted (outpainted)
 * rather than reflected. It carries none of the animated water effects, which stop at
 * the canvas edge.
 *
 * Rendered inside the renderer's world box, so it shares the camera transform.
 */
export function WorldSurfaceSeaMargin({ canvas, marginPx, sources }: WorldSurfaceSeaMarginProps) {
  if (marginPx <= 0 || sources.length === 0) return null;

  const strip = (side: 'left' | 'right') => (
    <div
      key={side}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: side === 'left' ? -marginPx : canvas.width,
        top: 0,
        width: marginPx,
        height: canvas.height,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {sources.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          loading="eager"
          decoding="async"
          style={{
            position: 'absolute',
            top: 0,
            left: side === 'left' ? marginPx - canvas.width : 0,
            width: canvas.width,
            height: canvas.height,
            // Tailwind's preflight caps every <img> at max-width: 100% of its parent, which here
            // is the narrow strip and would squash the whole map into it.
            maxWidth: 'none',
            maxHeight: 'none',
            transform: 'scaleX(-1)',
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      {strip('left')}
      {strip('right')}
    </>
  );
}

export default WorldSurfaceSeaMargin;
