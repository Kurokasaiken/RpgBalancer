import React from 'react';

export interface MatericCloudWallProps {
  /** Square edge size. */
  size?: number;
  /** Cloud image source. */
  imageUrl?: string;
  /** Extra CSS class. */
  className?: string;
  /** Inline styles. */
  style?: React.CSSProperties;
  /** Show the top golden rim light. Default true. */
  rimLight?: boolean;
}

/**
 * A square cloud wall used as a stage under event cards.
 *
 * The image is color-graded toward deep teal/octane tones with a golden
 * top rim light. Designed to sit behind a `MatericEventCard` or similar
 * Golden component.
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative', width: 600, height: 600 }}>
 *   <MatericCloudWall size={600} />
 *   <MatericEventCard ... style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
 * </div>
 * ```
 */
export const MatericCloudWall: React.FC<MatericCloudWallProps> = ({
  size = 400,
  imageUrl = '/assets/atmosphere/naruto-cloud-wall.png',
  className,
  style,
  rimLight = true,
}) => {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundColor: '#0b2b36',
        ...style,
      }}
    >
      {/* Base cloud wall image */}
      <img
        src={imageUrl}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          filter: 'brightness(0.85) contrast(1.05) hue-rotate(140deg) saturate(1.3)',
        }}
      />
      {/* Deep octane multiply overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(20, 70, 90, 0.55) 0%, rgba(10, 40, 55, 0.65) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
      {/* Soft cyan/octane glow at the center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(30, 110, 130, 0.25) 0%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />
      {rimLight && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 3px 14px rgba(212, 175, 55, 0.38)',
          }}
        />
      )}
    </div>
  );
};

export default MatericCloudWall;
