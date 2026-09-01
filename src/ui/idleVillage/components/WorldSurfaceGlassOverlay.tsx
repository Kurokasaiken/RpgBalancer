import React, { useEffect, useState } from 'react';
import { atmosphereAssets } from '../config/atmosphereAssets';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setReduced(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    (mq as any).addListener(handler);
    return () => (mq as any).removeListener(handler);
  }, []);
  return reduced;
}

/**
 * Glass teca overlay for the world-surface viewport.
 *
 * v2: a single dominant reflection, edge optical accumulation, two micro-sheens,
 * and SVG caustics. The layer is intentionally thin — the map is the subject,
 * not the glass. Pointer reaction is read from the CSS variables `--gx`/`--gy`
 * that the renderer updates with a smoothed rAF loop.
 */
export const WorldSurfaceGlassOverlay: React.FC = () => {
  const reduced = useReducedMotion();
  const { glass } = atmosphereAssets;

  if (!glass.enabled) return null;

  const {
    sheenOpacity,
    reflectionOpacity,
    causticOpacity,
    edgeOpacity,
    tint,
    parallaxMaxPx,
    reflectionBlurPx,
    causticBlurPx,
  } = glass;

  const uid = React.useId().replace(/:/g, '');
  const blurId = `glass-blur-${uid}`;

  const base = { position: 'absolute', inset: 0 } as React.CSSProperties;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: tint,
      }}
    >
      {/* Edge optical accumulation: light at the sides, slight weight at top/bottom. */}
      <div
        style={{
          ...base,
          background: `
            linear-gradient(
              90deg,
              rgba(255,255,255,${edgeOpacity * 0.25}),
              transparent 8%,
              transparent 92%,
              rgba(255,255,255,${edgeOpacity * 0.18})
            ),
            linear-gradient(
              180deg,
              rgba(255,255,255,${edgeOpacity * 0.22}),
              transparent 8%,
              transparent 92%,
              rgba(0,0,0,${edgeOpacity * 0.30})
            )
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* Subtle border to sell the pane. */}
      <div
        style={{
          ...base,
          border: `1px solid rgba(255,255,255,${edgeOpacity * 0.08})`,
        }}
      />

      {/* Two very soft sheen spots. */}
      <div
        style={{
          ...base,
          background: `
            radial-gradient(circle at 30% 25%, rgba(255,245,210,${sheenOpacity}) 0%, transparent 24%),
            radial-gradient(circle at 72% 68%, rgba(180,220,255,${sheenOpacity * 0.7}) 0%, transparent 20%)
          `,
          mixBlendMode: 'screen',
          transform: reduced
            ? 'none'
            : `translate3d(calc(var(--gx, 0) * -${parallaxMaxPx * 0.35}px), calc(var(--gy, 0) * -${parallaxMaxPx * 0.25}px), 0)`,
        }}
      />

      {/* Dominant diagonal reflection: the surface. */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '70%',
          height: '140%',
          background: `linear-gradient(
            112deg,
            transparent 42%,
            rgba(255, 240, 205, ${reflectionOpacity * 0.25}) 47%,
            rgba(255, 255, 255, ${reflectionOpacity}) 50%,
            rgba(255, 240, 205, ${reflectionOpacity * 0.25}) 53%,
            transparent 58%
          )`,
          filter: `blur(${reflectionBlurPx}px)`,
          mixBlendMode: 'screen',
          transform: reduced
            ? 'rotate(112deg)'
            : `rotate(112deg) translate3d(calc(var(--gx, 0) * -${parallaxMaxPx}px), calc(var(--gy, 0) * -${parallaxMaxPx * 0.7}px), 0)`,
        }}
      />

      {/* SVG caustics: irregular light streaks, not round spots. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          ...base,
          mixBlendMode: 'screen',
          transform: reduced
            ? 'none'
            : `translate3d(calc(var(--gx, 0) * -${parallaxMaxPx * 0.12}px), calc(var(--gy, 0) * -${parallaxMaxPx * 0.09}px), 0)`,
        }}
      >
        <defs>
          <filter id={blurId} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={causticBlurPx} />
          </filter>
        </defs>
        <path
          d="M -5 32 C 14 18, 22 42, 39 30 S 66 18, 82 34 S 104 26, 108 42"
          fill="none"
          stroke="white"
          strokeWidth="3"
          opacity={causticOpacity}
          filter={`url(#${blurId})`}
        />
        <path
          d="M -5 68 C 22 80, 34 58, 54 68 S 78 80, 105 65"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          opacity={causticOpacity * 0.7}
          filter={`url(#${blurId})`}
        />
      </svg>
    </div>
  );
};
