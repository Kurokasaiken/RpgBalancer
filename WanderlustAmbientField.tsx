import type { CSSProperties, ReactNode } from 'react';
import React from 'react';

/* ════════════════════════════════════════════════════════════════════════
 *  WANDERLUST AMBIENT FIELD
 *
 *  Atmospheric background layer for WanderlustSurface content areas.
 *  Renders BEHIND the content (z:0..1), content sits at z:2.
 *
 *  Four layers:
 *  1. Nebula — organic warm-gold light pools that drift slowly
 *  2. Vignette — radial darkening toward edges
 *  3. Light leak — breathing warm spot (top-left), ambient torch sim
 *  4. Fireflies — 5-6 luminous motes rising with S-curve + pulse
 *
 *  Performance rules:
 *  - ALL animations use only transform + opacity (compositor / GPU)
 *  - Zero feTurbulence animated at runtime
 *  - will-change on animated elements
 *  - prefers-reduced-motion kills all motion
 * ════════════════════════════════════════════════════════════════════════ */

export interface WanderlustAmbientFieldProps {
  /** Disable all animations (isDragging, isOpening etc.) */
  paused?: boolean;
  /** Number of fireflies (default 5, max 8) */
  fireflyCount?: number;
  /** Children rendered above the atmosphere at z-index:2 */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

// Firefly configs: left%, duration, delay, drift variant
const FIREFLY_PRESETS = [
  { left: 16, dur: 19, delay: 0,   variant: 1, size: 4 },
  { left: 40, dur: 24, delay: -5,  variant: 2, size: 3 },
  { left: 63, dur: 22, delay: -11, variant: 1, size: 5 },
  { left: 82, dur: 26, delay: -3,  variant: 2, size: 3 },
  { left: 30, dur: 21, delay: -15, variant: 1, size: 4 },
  { left: 70, dur: 23, delay: -8,  variant: 2, size: 3 },
  { left: 50, dur: 20, delay: -18, variant: 1, size: 3 },
  { left: 12, dur: 25, delay: -7,  variant: 2, size: 4 },
];

const GLOW_DURATIONS = [3.2, 4.1, 2.8, 3.6, 3.9, 3.3, 3.0, 4.4];

export const WanderlustAmbientField: React.FC<WanderlustAmbientFieldProps> = ({
  paused = false,
  fireflyCount = 5,
  children,
  className,
  style,
}) => {
  const count = Math.min(fireflyCount, FIREFLY_PRESETS.length);
  const playState = paused ? 'paused' : 'running';

  return (
    <div className={className} style={{
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      {/* Layer 0: Nebula */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        mixBlendMode: 'screen', opacity: 0.5,
        background: [
          'radial-gradient(ellipse 180px 140px at 22% 30%, rgba(216,177,62,0.10), transparent 70%)',
          'radial-gradient(ellipse 220px 160px at 78% 55%, rgba(240,207,106,0.08), transparent 70%)',
          'radial-gradient(ellipse 160px 130px at 55% 80%, rgba(200,150,70,0.07), transparent 70%)',
        ].join(', '),
        animation: 'wl-nebula-drift 24s ease-in-out infinite alternate',
        animationPlayState: playState,
      } as CSSProperties} />

      {/* Layer 1: Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at 50% 40%, transparent 38%, rgba(0,0,0,0.4) 82%, rgba(0,0,0,0.65) 100%)',
      }} />

      {/* Layer 1b: Light leak */}
      <div style={{
        position: 'absolute', top: -40, left: -40, width: 240, height: 200,
        pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at 30% 30%, rgba(240,207,106,0.1), rgba(216,177,62,0.04) 40%, transparent 70%)',
        animation: 'wl-leak-breathe 7s ease-in-out infinite',
        animationPlayState: playState,
      } as CSSProperties} />

      {/* Layer 1c: Fireflies */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        {FIREFLY_PRESETS.slice(0, count).map((ff, i) => (
          <span key={i} style={{
            position: 'absolute',
            width: `${ff.size}px`, height: `${ff.size}px`,
            left: `${ff.left}%`, bottom: '-12px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,236,170,0.9), rgba(240,207,106,0.4) 45%, transparent 75%)',
            filter: 'blur(0.5px)',
            willChange: 'transform, opacity',
            animation: `wl-fly-rise${ff.variant} ${ff.dur}s ease-in-out infinite, wl-fly-glow ${GLOW_DURATIONS[i]}s ease-in-out infinite`,
            animationDelay: `${ff.delay}s, ${-(i * 0.7)}s`,
            animationPlayState: playState,
          } as CSSProperties} />
        ))}
      </div>

      {/* Layer 2: Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
};

export default WanderlustAmbientField;
