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
 * Sits on top of the map and adds the convex-glass feel of the Window primitive:
 * subtle backdrop brightening, screen-blended highlights, a diagonal reflection
 * and caustic pools. The light layers follow the mouse through the CSS variables
 * `--gx` and `--gy` that `WorldSurfaceRenderer` sets on the viewport.
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
  } = glass;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: tint,
        boxShadow: `inset 0 0 120px 40px rgba(0,0,0,${edgeOpacity})`,
      }}
    >
      {/* Glass sheen — cool/warm specular spots */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 30% 25%, rgba(255,245,210,${sheenOpacity}) 0%, transparent 30%),
            radial-gradient(circle at 72% 68%, rgba(180,220,255,${sheenOpacity * 0.7}) 0%, transparent 25%)
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* Diagonal reflection that slides with the light source. */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '70%',
          height: '140%',
          background: `linear-gradient(115deg, transparent 35%, rgba(255,205,100,${reflectionOpacity * 0.7}) 45%, rgba(255,235,180,${reflectionOpacity}) 50%, transparent 60%)`,
          filter: 'blur(40px)',
          mixBlendMode: 'screen',
          transform: reduced
            ? 'rotate(18deg)'
            : `rotate(18deg) translate3d(calc(var(--gx, 0) * -${parallaxMaxPx}px), calc(var(--gy, 0) * -${parallaxMaxPx * 0.7}px), 0)`,
          transition: reduced ? 'none' : 'transform 150ms ease-out',
        }}
      />

      {/* Caustic light pools. */}
      <div
        style={{
          position: 'absolute',
          inset: '-12px',
          background: `
            radial-gradient(circle at 35% 30%, rgba(255,230,160,${causticOpacity}) 0%, transparent 30%),
            radial-gradient(circle at 70% 72%, rgba(160,230,255,${causticOpacity * 0.8}) 0%, transparent 28%)
          `,
          mixBlendMode: 'screen',
          transform: reduced
            ? 'none'
            : `translate3d(calc(var(--gx, 0) * -${parallaxMaxPx * 0.8}px), calc(var(--gy, 0) * -${parallaxMaxPx * 0.6}px), 0)`,
          transition: reduced ? 'none' : 'transform 150ms ease-out',
        }}
      />

      {/* Final vignette to seal the edges. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
};
