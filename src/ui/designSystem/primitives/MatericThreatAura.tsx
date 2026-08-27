import React, { useId } from 'react';
import { matericThreatAuraTokens } from '@/balancing/config/idleVillage/matericThreatAuraTokens';

export interface MatericThreatAuraProps {
  /** Size of the aura in pixels. */
  size?: number;
  /** Sticker / image to frame. */
  children: React.ReactNode;
  /** Parallax offset in the range [-1, 1]. */
  parallax?: { x: number; y: number };
  /** Extra CSS class. */
  className?: string;
  /** Inline styles. */
  style?: React.CSSProperties;
}

const { palette, layout, animation, particles } = matericThreatAuraTokens;

/**
 * A material frame that wraps a sticker/image with an organic teal threat aura,
 * gold glow border, subtle pulse and luminous floating particles.
 *
 * Designed to sit over a `MatericEventCard` or similar surface. It is
 * `pointer-events: none` so it does not block the card underneath.
 */
export const MatericThreatAura: React.FC<MatericThreatAuraProps> = ({
  size = 300,
  children,
  parallax = { x: 0, y: 0 },
  className,
  style,
}) => {
  const uid = useId().replace(/:/g, '');
  const pulseName = `${animation.pulseName}-${uid}`;

  // Sticker moves with the parallax vector; the aura moves slightly opposite
  // to create depth.
  const stickerX = parallax.x * 10;
  const stickerY = parallax.y * 10;
  const auraX = parallax.x * -6;
  const auraY = parallax.y * -6;

  const inset = size * 0.05;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* Pulsing radial glow — two overlapping gradients for depth. */}
      <div
        style={{
          position: 'absolute',
          top: inset,
          left: inset,
          right: inset,
          bottom: inset,
          borderRadius: '42% 58% 48% 52% / 38% 42% 58% 62%',
          background: `radial-gradient(circle at 42% 38%, ${palette.coreTeal}, transparent 65%), radial-gradient(circle at 72% 78%, ${palette.goldGlow} 0%, transparent 38%)`,
          filter: `blur(${layout.blur}px)`,
          transform: `translate(${auraX}px, ${auraY}px)`,
          opacity: 0.85,
          animation: `${pulseName} ${animation.pulseDuration}s ease-in-out infinite`,
        }}
      />

      {/* Organic gold frame + floating particles. */}
      <svg
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          fill: 'none',
          stroke: palette.gold,
          strokeWidth: 0.7,
          filter: `drop-shadow(0 0 ${layout.glowRadius}px ${palette.goldGlow})`,
          overflow: 'visible',
        }}
        aria-hidden="true"
      >
        <path d={layout.blobPath} fill={palette.coreTealDark} opacity="0.6" />
        <path d={layout.blobPath} />
        {particles.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} opacity={p.opacity}>
            <animate attributeName="opacity" values={p.opacityValues} dur={`${p.dur}s`} repeatCount="indefinite" />
            <animate attributeName="cy" values={p.cyValues} dur={`${p.dur}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Sticker with parallax. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(${stickerX}px, ${stickerY}px)`,
          zIndex: 1,
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes ${pulseName} {
          0%, 100% { transform: translate(${auraX}px, ${auraY}px) scale(1); opacity: 0.85; }
          50% { transform: translate(${auraX}px, ${auraY}px) scale(${layout.pulseScaleMax}); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
};

export default MatericThreatAura;
