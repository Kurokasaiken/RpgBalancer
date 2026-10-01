import type { CSSProperties } from 'react';

/**
 * A world-aligned mask for ONE small element, instead of one mask on a world-sized
 * container. `mask-image` forces its own compositing layer, and a layer as large as
 * the world box (4240 px) is past the ~4096 px edge WebKit rasterizes reliably —
 * decorations inside it can drop out while the camera moves. A per-element mask
 * keeps every masked layer the size of the element, and the mask image itself is
 * shared by all of them.
 */
export function localMaskStyle(
  maskUrl: string,
  canvas: { width: number; height: number },
  box: { x: number; y: number },
): CSSProperties {
  const size = `${canvas.width}px ${canvas.height}px`;
  const position = `${-box.x}px ${-box.y}px`;
  return {
    maskImage: `url(${maskUrl})`,
    WebkitMaskImage: `url(${maskUrl})`,
    maskSize: size,
    WebkitMaskSize: size,
    maskPosition: position,
    WebkitMaskPosition: position,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  };
}
