import React from 'react';
import { motion } from 'framer-motion';

export interface StickerFrameProps {
  /** Source URL for the sticker image. */
  imageSrc: string;
  /** Alt text for the image. */
  imageAlt?: string;
  /** Frame width in pixels. */
  width?: number;
  /** Frame height in pixels. */
  height?: number;
  /** Corner radius of the sticker border. */
  borderRadius?: number;
  /** Thickness of the drawn border. */
  borderWidth?: number;
  /** Duration of the pen-drawing animation in seconds. */
  drawDuration?: number;
  /** Additional CSS class. */
  className?: string;
}

/**
 * `StickerFrame` — draws a fantasy sticker border around an image with a pen-stroke animation.
 *
 * Uses an SVG `motion.rect` with `pathLength` to simulate the border being drawn by hand.
 * All colors come from the active skin tokens.
 */
export const StickerFrame: React.FC<StickerFrameProps> = ({
  imageSrc,
  imageAlt = '',
  width = 300,
  height = 300,
  borderRadius = 24,
  borderWidth = 12,
  drawDuration = 1.5,
  className,
}) => {
  const uid = React.useId();
  const padding = borderWidth + 8;
  const viewW = width + padding * 2;
  const viewH = height + padding * 2;
  const rx = borderRadius;

  const shadowId = `sticker-shadow-${uid.replace(/:/g, '')}`;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: viewW,
        height: viewH,
        display: 'inline-block',
      }}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        style={{
          position: 'absolute',
          left: padding,
          top: padding,
          width,
          height,
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />
      <svg
        width={viewW}
        height={viewH}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
        aria-hidden="true"
      >
        <defs>
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="var(--skin-window-shadow, rgba(0,0,0,0.65))" />
          </filter>
        </defs>
        <motion.rect
          x={padding}
          y={padding}
          width={width}
          height={height}
          rx={rx}
          ry={rx}
          fill="var(--skin-surface-bg, #060f16)"
          stroke="var(--skin-surface-border, rgba(223,184,87,0.5))"
          strokeWidth={borderWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${shadowId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: drawDuration, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
};

export default StickerFrame;
