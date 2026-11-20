import React, { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useHudBandPx } from './hudBand';
import { cartouchePath, type PlaqueGeometry } from '@/ui/designSystem/primitives/geometry/cartouchePath';

export type HudPlaqueShape = 'hang' | 'plinth' | 'panel' | 'field' | 'recess';

/** Silhouettes and layer widths. Numbers only: every colour comes from a `--skin-hud-*` token. */
const SHAPES: Record<HudPlaqueShape, PlaqueGeometry> = {
  hang: { shape: 'hang', size: 30, sag: 3 },
  plinth: { shape: 'plinth', size: 30, sag: 3 },
  panel: { shape: 'panel', size: 18 },
  /* `field`: square rect, no own silhouette — the enamel runs flush under a
   * painted frame's edges so its corners are covered (Director 2026-11-20:
   * «un rettangolo stondato in più / angoli ritagliati»). */
  field: { shape: 'panel', size: 0 },
  /* `recess`: same flush base as `field`, plus a chamfered inset field with an
   * engraved hairline and brass pins at the four inner corners — the
   * «contro-cornice» option. Drawn manually below, not via cartouchePath. */
  recess: { shape: 'panel', size: 0 },
};
const RECESS_INSET = 5;
const RECESS_CUT = 12;
const RECESS_PIN_R = 3;

const chamferRectPath = (w: number, h: number, inset: number, cut: number): string =>
  `M ${inset + cut} ${inset} H ${w - inset - cut} L ${w - inset} ${inset + cut}` +
  ` V ${h - inset - cut} L ${w - inset - cut} ${h - inset} H ${inset + cut}` +
  ` L ${inset} ${h - inset - cut} V ${inset + cut} Z`;
const SEAT_PX = 1.25;
const GRAIN_TILE_PX = 256;
const GRAIN_SRC = '/assets/ui/bg.webp';
const tokenStop = (name: string): CSSProperties => ({ stopColor: `var(${name})` });

export interface HudPlaqueProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  shape?: HudPlaqueShape;
  /** Render as a different element (e.g. 'section'). Default 'div'. */
  as?: keyof React.JSX.IntrinsicElements;
  /** R-357: skip the inner highlight, the dark step and the brass BAND — keep shadow, lacquer, grain and seat. Used when
   *  a painted frame (`PanelFrameOrnaments` 'cornici') carries the border, so the old band no longer reads as a second
   *  frame under it (Director 2026-11-18: «sembra che ci sono 2 frame uno sopra l'altro»). */
  bare?: boolean;
  /** Interior material: 'lacquer' (default teal) or 'enamel' (canonical emerald). */
  tone?: 'lacquer' | 'enamel';
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
export const HudPlaque: React.FC<HudPlaqueProps> = ({ shape = 'panel', as: Tag = 'div', bare = false, tone = 'lacquer', children, style, ...rest }) => {
  const mat = tone === 'enamel' ? 'enamel' : 'lacquer';
  const isField = shape === 'field' || shape === 'recess';
  const Component = Tag as React.ElementType;
  const ref = useRef<HTMLElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const uid = useId().replace(/:/g, '');
  const BAND_PX = useHudBandPx();

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

  const d = useMemo(() => {
    if (!size) return '';
    if (shape === 'recess') return chamferRectPath(size.w, size.h, RECESS_INSET, RECESS_CUT);
    return cartouchePath(SHAPES[shape], size.w, size.h);
  }, [shape, size]);

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
              <stop offset="0" style={tokenStop(`--skin-hud-${mat}-lift`)} />
              <stop offset="0.55" style={tokenStop(`--skin-hud-${mat}-base`)} />
              <stop offset="1" style={tokenStop(`--skin-hud-${mat}-deep`)} />
            </linearGradient>
            {/* Vignette for `field`/`recess` (Director 2026-11-21 «piatti»):
             *  the flush enamel gets a radial pool — lifted centre over deep
             *  edges, the mockups' depth cue the linear fill lacks. */}
            <radialGradient id={`vq-${uid}`} cx="0.5" cy="0.42" r="0.82">
              <stop offset="0" style={tokenStop(`--skin-hud-${mat}-lift`)} />
              <stop offset="0.58" style={tokenStop(`--skin-hud-${mat}-base`)} />
              <stop offset="1" style={tokenStop(`--skin-hud-${mat}-deep`)} />
            </radialGradient>
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
          </defs>
          {shape === 'recess' && size && (
            <rect x={0} y={0} width={size.w} height={size.h} style={{ fill: `var(--skin-hud-${mat}-deep)` }} />
          )}
          <path d={d} fill={`url(#${isField ? 'vq' : 'lq'}-${uid})`} style={{ fillOpacity: 'var(--skin-hud-lacquer-alpha)' }} />
          <path d={d} fill={`url(#gr-${uid})`} style={{ opacity: 'var(--skin-hud-grain-alpha)' }} />
          {shape === 'recess' && size && (
            <>
              {/* incised hairline on the chamfered field edge + a brass pin on
               *  each inner corner — echoes the frame's diagonal cuts/gems. */}
              <path d={d} fill="none" style={{ stroke: 'var(--skin-hud-brass-low)' }} strokeWidth={1} opacity={0.55} />
              {[
                [RECESS_INSET + RECESS_CUT / 2, RECESS_INSET + RECESS_CUT / 2],
                [size.w - RECESS_INSET - RECESS_CUT / 2, RECESS_INSET + RECESS_CUT / 2],
                [RECESS_INSET + RECESS_CUT / 2, size.h - RECESS_INSET - RECESS_CUT / 2],
                [size.w - RECESS_INSET - RECESS_CUT / 2, size.h - RECESS_INSET - RECESS_CUT / 2],
              ].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={RECESS_PIN_R}
                  style={{ fill: 'var(--skin-hud-brass-hi)', stroke: 'var(--skin-hud-brass-foot)' }} strokeWidth={0.75} />
              ))}
            </>
          )}
          {!(bare || isField) && (<g clipPath={`url(#in-${uid})`}>
            <path d={d} fill="none" stroke={`url(#hl-${uid})`} strokeWidth={2 * (BAND_PX + 3)} />
            <path d={d} fill="none" style={{ stroke: 'var(--skin-hud-step)' }} strokeWidth={2 * (BAND_PX + 1)} />
            {/* R-253: the wear mask cut the band through to the dark step,
             *  and where the texture landed dark at a corner the plaque read
             *  as «dark ears» instead of finishing with the rounded gold
             *  border (Director eye-check). The band now paints solid — the
             *  brass gradient still carries the material variation. */}
            <path d={d} fill="none" stroke={`url(#br-${uid})`} strokeWidth={2 * BAND_PX} />
          </g>)}
          {!isField && (
            <path d={d} fill="none" style={{ stroke: 'var(--skin-hud-seat)' }} strokeWidth={SEAT_PX} />
          )}
        </svg>
      )}
      {children}
    </Component>
  );
};

export default HudPlaque;
