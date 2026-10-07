import React, { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cartouchePath, type PlaqueGeometry } from '@/ui/designSystem/primitives/geometry/cartouchePath';

export type HudPlaqueShape = 'hang' | 'plinth' | 'panel';

/** Silhouettes and layer widths. Numbers only: every colour comes from a `--skin-hud-*` token. */
const SHAPES: Record<HudPlaqueShape, PlaqueGeometry> = {
  hang: { shape: 'hang', size: 30, sag: 3 },
  plinth: { shape: 'plinth', size: 30, sag: 3 },
  panel: { shape: 'panel', size: 18 },
};
const BAND_PX = 2;
const SEAT_PX = 1.25;
const GRAIN_TILE_PX = 256;
const WEAR_TILE_PX = 128;
const GRAIN_SRC = '/assets/ui/bg.webp';
const WEAR_SRC = '/assets/ui/hud/wear_mask.webp';
const tokenStop = (name: string): CSSProperties => ({ stopColor: `var(${name})` });

export interface HudPlaqueProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  shape?: HudPlaqueShape;
  /** Render as a different element (e.g. 'section'). Default 'div'. */
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * HudPlaque — the single frame construction of the HUD ("Lacquer Atlas").
 *
 * One SVG sibling of the content, never a clip-path on the content: shadow, lacquer
 * (sea-teal in shadow), grain, inner highlight, a dark step, a worn
 * bronze band clipped to the inside of the path, and an opaque seat line outside it.
 * The seat, the band and the shadow are not optional: the bronze alone disappears
 * against sand and sea, and it is the seat line that keeps the border visible.
 */
export const HudPlaque: React.FC<HudPlaqueProps> = ({ shape = 'panel', as: Tag = 'div', children, style, ...rest }) => {
  const Component = Tag as React.ElementType;
  const ref = useRef<HTMLElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const uid = useId().replace(/:/g, '');

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const measure = () => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const d = useMemo(() => (size ? cartouchePath(SHAPES[shape], size.w, size.h) : ''), [shape, size]);

  return (
    <Component ref={ref} data-skin="hud-plaque" style={{ position: 'relative', isolation: 'isolate', ...style }} {...rest}>
      {size && d && (
        <svg
          aria-hidden="true"
          width={size.w}
          height={size.h}
          style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'visible', filter: 'var(--skin-hud-shadow-filter)' }}
        >
          <defs>
            <clipPath id={`in-${uid}`}>
              <path d={d} />
            </clipPath>
            <linearGradient id={`lq-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={tokenStop('--skin-hud-lacquer-lift')} />
              <stop offset="0.55" style={tokenStop('--skin-hud-lacquer-base')} />
              <stop offset="1" style={tokenStop('--skin-hud-lacquer-deep')} />
            </linearGradient>
            <linearGradient id={`br-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={size.h}>
              <stop offset="0" style={tokenStop('--skin-hud-brass-crest')} />
              <stop offset="0.12" style={tokenStop('--skin-hud-brass-hi')} />
              <stop offset="0.34" style={tokenStop('--skin-hud-brass-mid')} />
              <stop offset="0.55" style={tokenStop('--skin-hud-brass-low')} />
              <stop offset="0.8" style={tokenStop('--skin-hud-brass-base')} />
              <stop offset="1" style={tokenStop('--skin-hud-brass-foot')} />
            </linearGradient>
            <linearGradient id={`hl-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--skin-hud-highlight)', stopOpacity: 'var(--skin-hud-highlight-alpha)' }} />
              <stop offset="0.4" style={{ stopColor: 'var(--skin-hud-highlight)', stopOpacity: 0 }} />
            </linearGradient>
            <pattern id={`gr-${uid}`} patternUnits="userSpaceOnUse" width={GRAIN_TILE_PX} height={GRAIN_TILE_PX}>
              <image href={GRAIN_SRC} width={GRAIN_TILE_PX} height={GRAIN_TILE_PX} />
            </pattern>
            <pattern id={`wp-${uid}`} patternUnits="userSpaceOnUse" width={WEAR_TILE_PX} height={WEAR_TILE_PX}>
              <image href={WEAR_SRC} width={WEAR_TILE_PX} height={WEAR_TILE_PX} />
            </pattern>
            <mask id={`wr-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={size.w} height={size.h}>
              <rect width={size.w} height={size.h} fill={`url(#wp-${uid})`} />
            </mask>
          </defs>
          <path d={d} fill={`url(#lq-${uid})`} style={{ fillOpacity: 'var(--skin-hud-lacquer-alpha)' }} />
          <path d={d} fill={`url(#gr-${uid})`} style={{ opacity: 'var(--skin-hud-grain-alpha)' }} />
          <g clipPath={`url(#in-${uid})`}>
            <path d={d} fill="none" stroke={`url(#hl-${uid})`} strokeWidth={2 * (BAND_PX + 3)} />
            <path d={d} fill="none" style={{ stroke: 'var(--skin-hud-step)' }} strokeWidth={2 * (BAND_PX + 1)} />
            <path d={d} fill="none" stroke={`url(#br-${uid})`} strokeWidth={2 * BAND_PX} mask={`url(#wr-${uid})`} />
          </g>
          <path d={d} fill="none" style={{ stroke: 'var(--skin-hud-seat)' }} strokeWidth={SEAT_PX} />
        </svg>
      )}
      {children}
    </Component>
  );
};

export default HudPlaque;
