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
  /** Render the glass refraction lens. Defaults to true. */
  glass?: boolean;
  /** Mouse-driven parallax of the caustic and reflection layers. Defaults to false. */
  parallax?: boolean;
  /** Render the caustic light pool. Defaults to true. */
  caustics?: boolean;
  /** Render the glass reflection overlay. Defaults to true. */
  reflections?: boolean;
  /** Additional CSS class. */
  className?: string;
}

const PARTICLE_COUNT = 20;

/**
 * Peak displacement at the rim, in px.
 *
 * `feDisplacementMap`'s scale is absolute pixels, not a fraction, so this is tuned
 * for the default window size. Much past 16 the rim starts smearing the image into
 * a ring instead of bending it.
 */
const REFRACTION_PX = 13;

/**
 * Maximum parallax displacement of the caustic and reflection layers, in px.
 *
 * The surface effects are meant to read as a thin layer of glass shifting under
 * the viewer. Six pixels is enough to feel alive; more breaks the illusion that
 * the object is still.
 */
const PARALLAX_MAX_PX = 6;

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
 *
 * The glass is a real refraction, not a gradient pretending to be one: the framed
 * image is run through an SVG `feDisplacementMap` fed by a precomputed vector field
 * (`scripts/build-glass-displacement.mjs`) that leaves the middle untouched and pulls
 * the image inward across the outer third. That inward pull at the rim is what the
 * eye reads as thickness. A stack of gradients can imply light on glass but cannot
 * bend what is behind it, and bending is the tell.
 *
 * Two things it deliberately does not do:
 *
 * `backdrop-filter: url(#...)` would refract whatever sits BEHIND the component, which
 * is what Apple's Liquid Glass does. Only Chromium supports it; on WebKit — and this
 * project ships in a WKWebView — it does nothing. The image here is a child rather
 * than a backdrop, so a plain `filter` on it works everywhere.
 *
 * No `feTurbulence`. It is the most expensive filter primitive there is, and a lens is
 * a smooth field, not noise.
 *
 * WebKit caveat: `feDisplacementMap` has a documented crash on some recent builds, and
 * the project's own effect whitelist files SVG filters as "test on the Tauri target
 * before trusting". If the filter fails to resolve the image simply renders unfiltered,
 * so the failure mode is a plain picture rather than a broken component.
 */
export const Window: React.FC<WindowProps> = ({
  imageSrc,
  imageAlt = '',
  children,
  size,
  particlesEnabled = true,
  glass = true,
  parallax = false,
  caustics = true,
  reflections = true,
  className,
}) => {
  const [hasError, setHasError] = React.useState(false);
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);

  const showGlass = glass && !hasError && !reduced;
  const showParallax = parallax && !reduced;
  const showCaustics = caustics;
  const showReflections = reflections;

  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent) => {
      if (!showParallax || !rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const halfW = rect.width / 2;
      const halfH = rect.height / 2;
      const nx = halfW ? (event.clientX - rect.left - halfW) / halfW : 0;
      const ny = halfH ? (event.clientY - rect.top - halfH) / halfH : 0;
      // Layer moves opposite to the pointer, as a surface in front of the image.
      rootRef.current.style.setProperty(
        '--skin-window-parallax-x',
        `${(-nx * PARALLAX_MAX_PX).toFixed(2)}px`,
      );
      rootRef.current.style.setProperty(
        '--skin-window-parallax-y',
        `${(-ny * PARALLAX_MAX_PX).toFixed(2)}px`,
      );
    },
    [showParallax],
  );

  const handleMouseLeave = React.useCallback(() => {
    if (!rootRef.current) return;
    rootRef.current.style.setProperty('--skin-window-parallax-x', '0px');
    rootRef.current.style.setProperty('--skin-window-parallax-y', '0px');
  }, []);
  // Filter ids are document-global, so two Windows on one page would otherwise
  // share — and fight over — a single definition.
  const filterId = `skin-window-glass-${React.useId().replace(/:/g, '')}`;
  const showParticles = particlesEnabled && !reduced;

  const cssSize = size === undefined ? 'var(--skin-window-size)' : `${size}px`;

  return (
    <div
      ref={rootRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
          <>
            {showGlass && (
            <svg
              aria-hidden="true"
              width="0"
              height="0"
              style={{ position: 'absolute' }}
            >
              <defs>
                {/*
                  sRGB, not the default linearRGB. The map encodes "no displacement"
                  as exactly 128; converting colour spaces on the way in moves that
                  value and the whole field picks up a constant drift.
                */}
                <filter id={filterId} colorInterpolationFilters="sRGB">
                  <feImage
                    href="/assets/ui/glass_displacement.png"
                    preserveAspectRatio="none"
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    result="lens"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="lens"
                    scale={REFRACTION_PX}
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>
            </svg>
            )}

            <img
              src={imageSrc}
              alt={imageAlt}
              loading="lazy"
              onError={() => setHasError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: showGlass ? `url(#${filterId})` : undefined,
              }}
            />
          </>
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
        {showCaustics && (
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: 'inherit',
              background: `
                radial-gradient(circle at 25% 20%, var(--skin-window-ambient-glow) 0%, transparent 32%),
                radial-gradient(circle at 75% 75%, var(--skin-window-ambient-accent) 0%, transparent 30%)
              `,
              pointerEvents: 'none',
              zIndex: 1,
              mixBlendMode: 'screen',
              transform: 'translate3d(var(--skin-window-parallax-x, 0px), var(--skin-window-parallax-y, 0px), 0)',
              transition: 'transform 120ms ease-out',
              willChange: 'transform',
            }}
          />
        )}

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

        {/*
          Specular rim.

          A hairline of light on the upper edge and a darker one below, which is how
          a curved transparent body catches a light above it. This is the cheap half
          of the effect and it carries a surprising amount of the read: the
          refraction says "there is thickness here", the rim says where its surface
          turns.
        */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            boxShadow:
              'inset 0 1px 0 0 var(--skin-window-glass-shine), inset 0 -1px 0 0 var(--skin-window-shadow), inset 0 0 0 1px var(--skin-window-glass-faint)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* Glass reflection overlay */}
        {showReflections && (
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: 'inherit',
              background: `
                linear-gradient(135deg, var(--skin-window-glass-shine) 0%, var(--skin-window-glass-faint) 35%, transparent 55%),
                linear-gradient(-45deg, transparent 65%, var(--skin-window-glass-faint) 100%)
              `,
              boxShadow: 'inset 0 0 24px var(--skin-window-particle-glow)',
              pointerEvents: 'none',
              zIndex: 4,
              mixBlendMode: 'overlay',
              transform: 'translate3d(var(--skin-window-parallax-x, 0px), var(--skin-window-parallax-y, 0px), 0)',
              transition: 'transform 120ms ease-out',
              willChange: 'transform',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Window;
