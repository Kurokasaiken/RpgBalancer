import React from 'react';

export interface WindowProps {
  /** Image URL displayed at the center of the encasing. */
  imageSrc: string;
  /** Alt text for the image. */
  imageAlt?: string;
  /** Optional content rendered above the image and effects. */
  children?: React.ReactNode;
  /** Diameter in pixels. Defaults to `--skin-window-size`. */
  size?: number;
  /** Show animated particles. Defaults to true. */
  particlesEnabled?: boolean;
  /** Additional CSS class. */
  className?: string;
}

const PARTICLE_COUNT = 20;

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  size: 2 + ((i * 3) % 4),
  left: 5 + ((i * 17) % 90),
  top: 8 + ((i * 23) % 80),
  duration: 3 + ((i * 7) % 5),
  delay: (i * 0.31) % 4,
}));

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    if ('addEventListener' in mq) {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    // Safari < 14 fallback
    (mq as MediaQueryList).addListener(update);
    return () => (mq as MediaQueryList).removeListener(update);
  }, []);
  return reduced;
}

/**
 * `Window` — a fantasy glass encasing that frames a central image like a snow globe.
 *
 * Renders a circular, sculpted border, caustic light accents, a glass reflection overlay,
 * and slow drifting particles. Built with skin CSS variables so it follows the active skin.
 */
export const Window: React.FC<WindowProps> = ({
  imageSrc,
  imageAlt = '',
  children,
  size,
  particlesEnabled = true,
  className,
}) => {
  const [hasError, setHasError] = React.useState(false);
  const reduced = usePrefersReducedMotion();
  const showParticles = particlesEnabled && !reduced;

  const cssSize = size === undefined ? 'var(--skin-window-size)' : `${size}px`;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: cssSize,
        height: cssSize,
        borderRadius: '50%',
        padding: 'var(--skin-window-frame-width)',
        background:
          'conic-gradient(from 0deg, var(--skin-window-frame-base), var(--skin-window-frame-highlight), var(--skin-window-frame-shine), var(--skin-window-frame-highlight), var(--skin-window-frame-base), var(--skin-window-frame-highlight), var(--skin-window-frame-shine), var(--skin-window-frame-highlight), var(--skin-window-frame-base))',
        boxShadow: '0 0 0 1px var(--skin-window-frame-highlight), var(--skin-window-drop-shadow), 0 0 60px var(--skin-window-particle-glow)',
      }}
      role={imageAlt ? 'img' : undefined}
      aria-label={imageAlt || undefined}
      aria-hidden={!imageAlt}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--skin-window-frame-base)',
          boxShadow: 'inset 0 0 24px 4px var(--skin-window-shadow)',
        }}
      >
        {hasError ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--skin-window-frame-base)',
            }}
          />
        ) : (
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            onError={() => setHasError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {children && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            {children}
          </div>
        )}

        {/* Caustic light pool */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `
              radial-gradient(circle at 25% 20%, var(--skin-window-ambient-glow) 0%, transparent 32%),
              radial-gradient(circle at 75% 75%, var(--skin-window-ambient-accent) 0%, transparent 30%)
            `,
            pointerEvents: 'none',
            zIndex: 1,
            mixBlendMode: 'screen',
          }}
        />

        {/* Particles */}
        {showParticles &&
          PARTICLES.map((p) => (
            <span
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: 'var(--skin-window-particle)',
                boxShadow: '0 0 6px var(--skin-window-particle-glow)',
                animation: `window-float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
                opacity: 0.6,
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          ))}

        {/* Glass reflection overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: `
              linear-gradient(135deg, var(--skin-window-glass-shine) 0%, var(--skin-window-glass-faint) 35%, transparent 55%),
              linear-gradient(-45deg, transparent 65%, var(--skin-window-glass-faint) 100%)
            `,
            boxShadow: 'inset 0 0 24px var(--skin-window-particle-glow)',
            pointerEvents: 'none',
            zIndex: 4,
            mixBlendMode: 'overlay',
          }}
        />
      </div>
    </div>
  );
};

export default Window;
