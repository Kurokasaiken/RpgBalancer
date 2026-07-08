import React, { useRef, useEffect, useState, useMemo } from 'react';
import clsx from 'clsx';
import './wanderlust-surface.css';
import { MATERIAL_PRESETS, type MaterialPreset, type MaterialTheme } from './materialPresets';
import WanderlustInnerSurface from './WanderlustInnerSurface';
import { WanderlustMaterialContext } from './WanderlustMaterialContext';

/* ═══════════════════════════════════════════════════════════════════
   WanderlustSurface
   ───────────────────────────────────────────────────────────────────
   A wrapper component that renders the V7 bronze border around any
   children. The SVG border scales dynamically to the container size.

   V8 MLE Integration: Optional Material Layer Engine props enable
   procedural AAA-style composition without changing the base aesthetics.

   Usage:
     <WanderlustSurface shape="panel">
       <YourContent />
     </WanderlustSurface>

   Prerequisites:
     - Render <WanderlustSurfaceDefs /> once at app root
     - Import wanderlust-surface.css
   ═══════════════════════════════════════════════════════════════════ */

export type WanderlustShape = 'panel' | 'card' | 'badge' | 'medallion' | 'tablet';

/**
 * Configuration for procedural material layering (V8 MLE).
 * Enables AAA-style material composition without manual layer management.
 */
export interface MaterialLayerConfig {
  /** Base texture material - maps to existing material presets */
  baseTexture?: 'obsidian' | 'marble' | 'parchment' | 'wood' | 'gold';
  /** Edge treatment for borders - WanderlustSurface has eroded-bronze built-in */
  edgeTreatment?: 'eroded-bronze' | 'sharp-gold' | 'rough-wood' | 'none';
  /** Emissive halo/glow effect - adds drop-shadow overlay */
  emissiveHalo?: 'emerald' | 'gold' | 'none';
  /** Enable micro-interactions (hover scale, glow transitions) - maps to interactive */
  microInteraction?: boolean;
  /** Enable rim light effect (1px soft highlight on top-left edge) - WanderlustSurface has rim arcs */
  rimLight?: boolean;
  /** Enable physical depth (multi-layer shadows for contact + elevation) - WanderlustSurface has layered shadows */
  physicalDepth?: boolean;
  /** Enable heavy feel (weighted easing for physical presence) - adds CSS transitions */
  heavyFeel?: boolean;
  /** Background mode for dynamic rim light calculation */
  backgroundMode?: 'marble' | 'parchment' | 'void' | 'bg';
}

export interface WanderlustSurfaceProps {
  /** Shape determines border-radius and content padding. */
  shape?: WanderlustShape;
  /** Material preset (bronze, silver, obsidian, jade). */
  material?: MaterialPreset;
  /** Enable hover/active transitions. */
  interactive?: boolean;
  /** Disable heavy SVG filters (for drag perf). */
  isDragging?: boolean;
  /** Pause rim breathing animation. */
  isPaused?: boolean;
  /** Extra className on the root wrapper. */
  className?: string;
  /** Inline style on the root wrapper. */
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /** V8 MLE: Material layer configuration for procedural AAA-style composition */
  materialLayer?: MaterialLayerConfig;
}

/** Border thickness in viewBox units — same for all shapes. */
const BORDER = 18;
/** Inner ring inset from border outer edge. */
const RING = 16;
/** Content field inset from outer edge. */
const FIELD = BORDER + 2;
/** Corner radius for outer shape (except badge/medallion). */
const RX_OUTER = 18;
/** Corner radius for inner ring. */
const RX_RING = 10;
/** Corner radius for content field. */
const RX_FIELD = 9;

export const WanderlustSurface: React.FC<WanderlustSurfaceProps> = ({
  shape = 'panel',
  material = 'bronze',
  interactive = false,
  isDragging = false,
  isPaused = false,
  className,
  style,
  children,
  materialLayer,
}) => {
  const theme = MATERIAL_PRESETS[material] ?? MATERIAL_PRESETS['bronze'];
  const prefix = material;
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 200 });

  // V8 MLE: Map materialLayer props to existing functionality
  const enableMLE = materialLayer !== undefined;
  const mleInteractive = materialLayer?.microInteraction ?? interactive;
  const mleHeavyFeel = materialLayer?.heavyFeel ?? false;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setSize({ w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rootCls = clsx(
    'ws-root',
    `ws-root--${shape}`,
    mleInteractive && 'ws-root--interactive',
    isDragging && 'ws-root--dragging',
    isPaused && 'ws-root--paused',
    // V8 MLE classes
    enableMLE && mleHeavyFeel && 'ws-root--heavy-feel',
    className,
  );

  /** Skip heavy filters during drag for performance. */
  const f = isDragging ? undefined : true;

  const { w, h } = size;

  // Derived layout values
  const outerX = 4;
  const outerY = 4;
  const outerW = w - 8;
  const outerH = h - 8;
  const ringX = RING + 4;
  const ringY = RING + 4;
  const ringW = w - (RING + 4) * 2;
  const ringH = h - (RING + 4) * 2;
  const fieldX = FIELD + 4;
  const fieldY = FIELD + 4;
  const fieldW = w - (FIELD + 4) * 2;
  const fieldH = h - (FIELD + 4) * 2;

  // Patina positions are proportional to size
  const patina = useMemo(() => generatePatina(w, h, theme), [w, h, theme]);
  const scratches = useMemo(() => generateScratches(w, h, theme), [w, h, theme]);
  const diamonds = useMemo(() => generateDiamonds(w, h, outerX, outerY, outerW, outerH), [w, h, outerX, outerY, outerW, outerH]);

  return (
    <WanderlustMaterialContext.Provider value={material}>
    <div ref={rootRef} className={rootCls} style={style}>
      {/* SVG Border Overlay */}
      <svg
        className="ws-border-svg"
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={`ws-co-${w}-${h}`}>
            <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER} />
          </clipPath>
          <clipPath id={`ws-ci-${w}-${h}`}>
            <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} rx={RX_FIELD} />
          </clipPath>
        </defs>

        {/* ════ BORDER FRAME ════ */}
        <g clipPath={`url(#ws-co-${w}-${h})`}>
          {/* L1: Bronze body layers */}
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER} fill={theme.baseFill} />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-nm)` : undefined} opacity=".94" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-nm2)` : undefined} opacity=".28" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-worn)` : undefined} opacity=".32" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-spec)` : undefined} opacity=".14" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gbv)`} opacity=".50" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-gb)`} filter={f ? `url(#${prefix}-ws-f-grime)` : undefined} opacity=".16" />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill={`url(#${prefix}-ws-g-ambient)`} style={{ mixBlendMode: 'overlay' }} />

          {/* L2: Rim arcs — copper, differentiated top/bottom */}
          <rect className="ws-rim-arc" x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill="none" stroke={`rgba(${theme.rimTopRGB},.30)`} strokeWidth="4"
            strokeDasharray={`${outerW * 0.64} 0 0 ${outerW * 1.36}`} strokeDashoffset="0"
            strokeLinecap="round" filter={f ? `url(#${prefix}-ws-f-gl)` : undefined} />
          <rect x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill="none" stroke={`rgba(${theme.rimBrightRGB},.58)`} strokeWidth="1"
            strokeDasharray={`${outerW * 0.53} 0 0 ${outerW * 1.47}`} strokeDashoffset="30"
            strokeLinecap="round" />
          <rect className="ws-rim-arc" x={outerX} y={outerY} width={outerW} height={outerH} rx={RX_OUTER}
            fill="none" stroke={`rgba(${theme.rimDimRGB},.10)`} strokeWidth="2"
            strokeDasharray={`0 0 ${outerW * 0.53} ${outerW * 1.47}`} strokeDashoffset="0"
            strokeLinecap="round" />

          {/* L3: Inner ring separator */}
          <rect x={ringX} y={ringY} width={ringW} height={ringH} rx={RX_RING}
            fill={theme.ringFill} filter={f ? `url(#${prefix}-ws-f-erode)` : undefined} />
          <rect x={ringX} y={ringY} width={ringW} height={ringH} rx={RX_RING}
            fill={`url(#${prefix}-ws-gri)`} filter={f ? `url(#${prefix}-ws-f-nm)` : undefined} opacity=".70" />
          <rect x={ringX + 0.5} y={ringY + 0.6} width={ringW} height={ringH} rx={RX_RING}
            fill="none" stroke={`rgba(${theme.ringBorderRGB},.72)`} strokeWidth="2.4" />
          {/* Top-left lit lip */}
          <rect x={ringX} y={ringY} width={ringW} height={ringH} rx={RX_RING}
            fill="none" stroke={`rgba(${theme.ringLitRGB},.26)`} strokeWidth="1"
            strokeDasharray={`${ringW * 0.6} 0 0 ${ringW * 1.4}`} strokeDashoffset="0"
            strokeLinecap="round" />
          {/* Bottom shadow lip */}
          <rect x={ringX} y={ringY} width={ringW} height={ringH} rx={RX_RING}
            fill="none" stroke={`rgba(${theme.ringShadowRGB},.50)`} strokeWidth="1.4"
            strokeDasharray={`0 0 ${ringW * 0.64} ${ringW * 1.36}`} strokeDashoffset="0"
            strokeLinecap="round" />

          {/* L4: Patina blobs (warped) */}
          {f && (
            <g filter={`url(#${prefix}-ws-f-warp)`}>
              {patina.map((p, i) => (
                p.ry
                  ? <ellipse key={i} cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} />
                  : <circle key={i} cx={p.cx} cy={p.cy} r={p.rx} fill={p.fill} />
              ))}
            </g>
          )}

          {/* L5: Scratches + bright exposed bronze */}
          {f && (
            <g>
              {scratches.map((s, i) => (
                <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                  stroke={s.stroke} strokeWidth={s.width} strokeLinecap="round" />
              ))}
            </g>
          )}

          {/* L6: Corner diamonds */}
          {shape !== 'badge' && shape !== 'medallion' && f && (
            <g>
              {diamonds.map((d, i) => (
                <React.Fragment key={i}>
                  {/* Contact shadow */}
                  <polygon points={d.points} fill={`rgba(${theme.diamondContactRGB},.32)`} transform="translate(2,2.5)" />
                  {/* Diamond body */}
                  <polygon points={d.points} fill={`url(#${prefix}-ws-gdm)`} stroke={`rgba(${theme.diamondStrokeRGB},.55)`} strokeWidth=".8" />
                  {/* Top-left lit facet */}
                  <polygon points={d.litFacet} fill={`rgba(${theme.diamondLitRGB},.38)`} />
                  {/* Bottom-right shadow facet */}
                  <polygon points={d.shadowFacet} fill={`rgba(${theme.diamondShadowRGB},.38)`} />
                </React.Fragment>
              ))}
            </g>
          )}
        </g>

        {/* ════ CARVED CONTENT WELL ════ */}
        <g clipPath={`url(#ws-ci-${w}-${h})`}>
          {/* Layered inner surface with subtle depth background */}
          <foreignObject x={fieldX} y={fieldY} width={fieldW} height={fieldH}>
            <WanderlustInnerSurface
              width={fieldW}
              height={fieldH}
              enableFilters={f}
            />
          </foreignObject>

          {/* Micro-bevel edges */}
          <rect x={fieldX} y={fieldY} width={fieldW} height={3} rx={0} fill={`url(#${prefix}-ws-bevel-t)`} />
          <rect x={fieldX} y={fieldY} width={3} height={fieldH} rx={0} fill={`url(#${prefix}-ws-bevel-l)`} />
          <rect x={fieldX} y={fieldY + fieldH - 3} width={fieldW} height={3} rx={0} fill={`url(#${prefix}-ws-bevel-b)`} />
          <rect x={fieldX + fieldW - 3} y={fieldY} width={3} height={fieldH} rx={0} fill={`url(#${prefix}-ws-bevel-r)`} />

          {/* Lip highlights */}
          <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} rx={RX_FIELD}
            fill={`url(#${prefix}-ws-rim-top)`} opacity=".60" />
          <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} rx={RX_FIELD}
            fill={`url(#${prefix}-ws-rim-left)`} opacity=".30" />

          {/* Perimetral AO */}
          <rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} rx={RX_FIELD}
            fill={`rgba(${theme.aoRGB},.24)`} filter={f ? `url(#${prefix}-ws-f-ao)` : undefined} />

          {/* Corner AO densification */}
          <circle cx={fieldX + 4} cy={fieldY + 4} r={16} fill={`rgba(${theme.aoCornerRGB},.32)`} />
          <circle cx={fieldX + fieldW - 4} cy={fieldY + 4} r={16} fill={`rgba(${theme.aoCornerRGB},.28)`} />
          <circle cx={fieldX + 4} cy={fieldY + fieldH - 4} r={16} fill={`rgba(${theme.aoCornerRGB},.36)`} />
          <circle cx={fieldX + fieldW - 4} cy={fieldY + fieldH - 4} r={16} fill={`rgba(${theme.aoCornerRGB},.40)`} />

          {/* Rim specular 0.5px */}
          <rect x={fieldX + 0.5} y={fieldY + 0.5} width={fieldW - 1} height={fieldH - 1} rx={RX_FIELD - 0.5}
            fill="none" stroke={`rgba(${theme.specularRGB},.18)`} strokeWidth=".5" />
          <rect x={fieldX + 0.5} y={fieldY + 0.5} width={fieldW - 1} height={fieldH - 1} rx={RX_FIELD - 0.5}
            fill="none" stroke={`rgba(${theme.specularBrightRGB},.30)`} strokeWidth=".5"
            strokeDasharray={`${fieldW * 0.76} 0 0 ${fieldW * 1.24}`} strokeDashoffset="0"
            strokeLinecap="round" />
        </g>
      </svg>

      {/* Content slot */}
      <div className="ws-content">
        {children}
      </div>
    </div>
    </WanderlustMaterialContext.Provider>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PROCEDURAL GENERATION HELPERS
   ═══════════════════════════════════════════════════════════════════ */

interface PatinaBlob {
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  fill: string;
}

/** Generates patina blobs positioned relative to the border edges. */
function generatePatina(w: number, h: number, theme: MaterialTheme): PatinaBlob[] {
  const dark = (opacity: number) => `rgba(${theme.patinaDark},${opacity})`;
  const bright = (opacity: number) => `rgba(${theme.patinaBright},${opacity})`;
  const green = (opacity: number) => `rgba(${theme.patinaGreen},${opacity})`;

  return [
    // Dark tarnish — corners and edges
    { cx: 18, cy: 22, rx: 14, fill: dark(0.45) },
    { cx: 8, cy: 40, rx: 9, fill: dark(0.40) },
    { cx: 30, cy: 50, rx: 7, fill: dark(0.35) },
    { cx: 22, cy: 68, rx: 10, ry: 6, fill: dark(0.30) },
    { cx: w - 20, cy: 18, rx: 13, fill: dark(0.42) },
    { cx: w - 12, cy: 42, rx: 8, fill: dark(0.38) },
    { cx: w - 30, cy: 58, rx: 11, ry: 5, fill: dark(0.32) },
    { cx: 22, cy: h - 25, rx: 11, fill: dark(0.40) },
    { cx: 40, cy: h - 14, rx: 7, fill: dark(0.36) },
    { cx: w - 22, cy: h - 22, rx: 15, fill: dark(0.46) },
    { cx: w - 35, cy: h - 12, rx: 9, fill: dark(0.40) },
    { cx: w - 16, cy: h - 40, rx: 8, ry: 12, fill: dark(0.36) },
    { cx: 6, cy: h * 0.5, rx: 8, fill: dark(0.34) },
    { cx: w - 6, cy: h * 0.45, rx: 7, fill: dark(0.30) },
    { cx: w * 0.5, cy: 6, rx: 9, fill: dark(0.28) },
    { cx: w * 0.33, cy: h - 10, rx: 10, fill: dark(0.32) },
    { cx: w * 0.74, cy: h - 12, rx: 8, fill: dark(0.30) },

    // Bright worn spots — polished/rubbed areas on flat surfaces
    { cx: w * 0.48, cy: h * 0.48, rx: 18, fill: bright(0.22) },
    { cx: w * 0.26, cy: h * 0.30, rx: 12, ry: 8, fill: bright(0.18) },
    { cx: w * 0.78, cy: h * 0.22, rx: 14, ry: 7, fill: bright(0.16) },
    { cx: w * 0.65, cy: h * 0.78, rx: 10, fill: bright(0.15) },
    { cx: w * 0.18, cy: h * 0.74, rx: 11, ry: 9, fill: bright(0.14) },

    // Green oxidation — moisture accumulation zones
    { cx: 14, cy: 62, rx: 9, ry: 5, fill: green(0.28) },
    { cx: w - 15, cy: h * 0.76, rx: 11, ry: 6, fill: green(0.24) },
    { cx: w - 28, cy: h - 18, rx: 13, ry: 7, fill: green(0.26) },
    { cx: 32, cy: h - 28, rx: 6, fill: green(0.22) },
    { cx: w * 0.25, cy: h - 10, rx: 8, ry: 4, fill: green(0.20) },
  ];
}

interface ScratchLine {
  x1: number; y1: number;
  x2: number; y2: number;
  stroke: string;
  width: number;
}

/** Generates scratches (dark grooves + bright exposed metal) relative to edges. */
function generateScratches(w: number, h: number, theme: MaterialTheme): ScratchLine[] {
  const groove = (opacity: number) => `rgba(${theme.scratchGroove},${opacity})`;
  const exposed = (opacity: number) => `rgba(${theme.scratchExposed},${opacity})`;

  return [
    // Dark grooves
    { x1: 6, y1: h * 0.26, x2: 18, y2: h * 0.40, stroke: groove(0.52), width: 1.8 },
    { x1: 10, y1: h * 0.34, x2: 22, y2: h * 0.44, stroke: groove(0.42), width: 1.2 },
    { x1: w - 18, y1: h * 0.52, x2: w - 8, y2: h * 0.64, stroke: groove(0.46), width: 1.5 },
    { x1: w * 0.10, y1: h - 12, x2: w * 0.15, y2: h - 6, stroke: groove(0.38), width: 1.3 },
    { x1: w * 0.80, y1: 5, x2: w * 0.86, y2: 10, stroke: groove(0.36), width: 1.1 },
    // Corner cross-hatches
    { x1: 15, y1: 15, x2: 38, y2: 8, stroke: groove(0.42), width: 1.0 },
    { x1: w - 35, y1: h - 18, x2: w - 12, y2: h - 10, stroke: groove(0.44), width: 1.2 },

    // Bright exposed metal (offset 1px from dark)
    { x1: 8, y1: h * 0.28, x2: 19, y2: h * 0.41, stroke: exposed(0.30), width: 0.8 },
    { x1: w - 16, y1: h * 0.53, x2: w - 7, y2: h * 0.64, stroke: exposed(0.26), width: 0.7 },
    { x1: 12, y1: h * 0.35, x2: 23, y2: h * 0.44, stroke: exposed(0.22), width: 0.6 },
    { x1: 16, y1: 16, x2: 39, y2: 9, stroke: exposed(0.22), width: 0.5 },
    { x1: w - 34, y1: h - 17, x2: w - 11, y2: h - 9, stroke: exposed(0.20), width: 0.5 },
  ];
}

interface Diamond {
  points: string;
  litFacet: string;
  shadowFacet: string;
}

/** Generates corner diamond ornaments. */
function generateDiamonds(
  _w: number,
  _h: number,
  ox: number,
  oy: number,
  ow: number,
  oh: number,
): Diamond[] {
  const SIZE = 12; // half-diagonal
  const INSET = 24; // from corner of outer rect

  const corners = [
    { cx: ox + INSET, cy: oy + INSET },
    { cx: ox + ow - INSET, cy: oy + INSET },
    { cx: ox + INSET, cy: oy + oh - INSET },
    { cx: ox + ow - INSET, cy: oy + oh - INSET },
  ];

  return corners.map(({ cx, cy }) => ({
    points: `${cx},${cy - SIZE} ${cx - SIZE},${cy} ${cx},${cy + SIZE} ${cx + SIZE},${cy}`,
    litFacet: `${cx},${cy - SIZE} ${cx - SIZE},${cy} ${cx},${cy}`,
    shadowFacet: `${cx},${cy + SIZE} ${cx + SIZE},${cy} ${cx},${cy}`,
  }));
}

export default WanderlustSurface;
