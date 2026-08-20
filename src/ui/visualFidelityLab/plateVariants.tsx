import React, { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './matericPlate.css';

/**
 * plateVariants — LAB-ONLY. Four candidate implementations of the recessed
 * content well, each a DIFFERENT physical hypothesis (object-identity law):
 *
 *   A · Bezel Molding   — a raised bronze picture-frame molding with real
 *                         thickness; the interior reads recessed because the
 *                         molding visibly stands proud (one metal band, lit
 *                         from above, painted as a single vertical gradient).
 *   B · Sloped Walls    — a true carved cut: four 45°-mitred trapezoid walls
 *                         (ONE geometry, shared vertices — no corner
 *                         artifacts), dark walls where light can't reach
 *                         (top/left), warm-lit walls where it can (bottom/
 *                         right), floor in contact shadow under the top wall.
 *   C · Obsidian Inlay  — a material change: a polished obsidian tile set
 *                         into the panel; depth is minimal, material presence
 *                         is maximal (diagonal sheen + pooled-glass corners).
 *   D · Engraved Filet  — luxury double-line gilded engraving (two gold
 *                         hairlines separated by a dark groove) + corner
 *                         diamonds echoing WanderlustSurface's DNA.
 *
 * Shared floor (all four): obsidian #060f16 + azure light-leak (world anima)
 * + contact AO. No grey, no silver, no muddy brown, no blurred dark-on-dark
 * shadows. Hard edges declare the depth; the floor stays opulent.
 * STATIC — no motion (Life Layer comes later).
 */

const RX = 9;

/* ── shared plumbing ─────────────────────────────────────────────── */

function usePlateSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 300, h: 120 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...size };
}

export interface PlateVariantProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  /** When `false`, the inner floor is not painted (frame-only look). Default `true`. */
  floor?: boolean;
}

/** Obsidian floor + azure leak + contact AO — identical in all variants. */
const Floor: React.FC<{ w: number; h: number; uid: string }> = ({ w, h, uid }) => (
  <>
    <defs>
      <radialGradient id={`azure-${uid}`} cx="50%" cy="0%" r="88%">
        <stop offset="0%" stopColor="rgba(0,229,255,0.10)" />
        <stop offset="45%" stopColor="rgba(0,150,255,0.03)" />
        <stop offset="80%" stopColor="rgba(0,150,255,0)" />
      </radialGradient>
      <radialGradient id={`ao-${uid}`} cx="50%" cy="46%" r="72%">
        <stop offset="55%" stopColor="rgba(2,8,12,0)" />
        <stop offset="90%" stopColor="rgba(1,5,9,0.42)" />
        <stop offset="100%" stopColor="rgba(0,3,6,0.66)" />
      </radialGradient>
    </defs>
    <rect x="0" y="0" width={w} height={h} fill="#060f16" />
    <rect x="0" y="0" width={w} height={h} fill={`url(#azure-${uid})`} />
    <rect x="0" y="0" width={w} height={h} fill={`url(#ao-${uid})`} />
  </>
);

/* ── A · Bezel Molding ───────────────────────────────────────────── */

export const BezelMolding: React.FC<PlateVariantProps> = ({ children, className, style, floor = true }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  const BAND = 5; // molding thickness
  const inset = BAND / 2 + 1;
  const innerX = BAND + 1;
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg className="mp-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x={innerX} y={innerX} width={w - innerX * 2} height={h - innerX * 2} rx={RX - 4} />
          </clipPath>
          {/* the molding band as an artist paints raised metal (NMM ladder):
              ivory specular crest → gold → body → bronze turn → warm-umber core
              at ~80% → a reflected-light uptick at the very bottom. Raised = lit
              crest at top. Warm throughout, no grey. */}
          <linearGradient id={`band-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3c9" />
            <stop offset="11%" stopColor="#f0cf6a" />
            <stop offset="33%" stopColor="#dfb857" />
            <stop offset="55%" stopColor="#b0803a" />
            <stop offset="80%" stopColor="#5f3f16" />
            <stop offset="100%" stopColor="#7a5220" />
          </linearGradient>
          <linearGradient id={`drop-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,3,8,0.7)" />
            <stop offset="100%" stopColor="rgba(0,3,8,0)" />
          </linearGradient>
        </defs>

        {/* dark seat line so the molding separates from the field */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={RX} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
        {/* THE molding: one band, one vertical light */}
        <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} rx={RX - 2} fill="none" stroke={`url(#band-${uid})`} strokeWidth={BAND} />
        {/* inner step edge (hard) — drawn only when a floor is painted */}
        {floor && (
          <rect x={innerX} y={innerX} width={w - innerX * 2} height={h - innerX * 2} rx={RX - 4} fill="none" stroke="rgba(1,3,6,0.8)" strokeWidth="1" />
        )}

        <g clipPath={`url(#clip-${uid})`}>
          {floor && (
            <>
              <Floor w={w} h={h} uid={uid} />
              {/* LIFT the interior 4-8 RGB (azure family) so the wall shadow has
                  luminance to remove — the research's "lift funds the wall" */}
              <rect x={innerX} y={innerX} width={w - innerX * 2} height={h - innerX * 2} fill="rgba(26,52,72,0.16)" />
              {/* contact shadow the raised molding casts down into the well (top wall) */}
              <rect x={innerX} y={innerX} width={w - innerX * 2} height="11" fill={`url(#drop-${uid})`} />
              {/* load-bearing cue: warm-gold lit lip on the bottom-inside edge */}
              <rect x={innerX + 1} y={h - innerX - 2} width={w - (innerX + 1) * 2} height="1.25" fill="rgba(240,207,106,0.34)" />
            </>
          )}
        </g>
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── Well bronze bezel (frame-only overlay, reused NMM ladder) ────── */

/**
 * WellBronzeBezel — a FRAME-ONLY bronze bezel overlay (the medallion's NMM metal
 * ladder: ivory crest → gold → bronze → warm-umber). Unlike BezelMolding it draws
 * NO interior — it sits ON TOP of a well that already owns its dark floor, adding
 * only the sculpted metal edge. `band` = molding thickness in px (default 1.75 =
 * "half of medio"). Absolutely positioned, pointer-transparent; drop it as the
 * first child of a position:relative well. Content stays inset by the well's
 * padding, so it never collides with the thin perimeter band.
 */
export const WellBronzeBezel: React.FC<{ band?: number; rx?: number; flush?: boolean }> = ({ band = 1.75, rx = RX - 1, flush = false }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  const inset = flush ? band / 2 : band / 2 + 1;
  const innerX = flush ? band : band + 1;
  return (
    <div ref={ref} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          {/* NMM ladder — WARM-GOLD crest (no white specular: the #fff3c9 crest
              read too clean/perfect/luminous). Dim warm gold on top → bronze →
              warm-umber base. */}
          <linearGradient id={`wbb-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8bd78" />
            <stop offset="12%" stopColor="#cfaf63" />
            <stop offset="34%" stopColor="#c2a355" />
            <stop offset="55%" stopColor="#a0762f" />
            <stop offset="80%" stopColor="#5f3f16" />
            <stop offset="100%" stopColor="#71501f" />
          </linearGradient>
          {/* micro-wear: displaces the band edge so the metal reads WORN, not
              machine-perfect (anti-perfection law). Subtle at this band width. */}
          <filter id={`wear-${uid}`} x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75 0.4" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {/* dark seat: separates the metal from the field */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={rx + 1} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {/* the bronze band — one vertical light (NMM ladder, warm-gold crest),
            half of medio, WORN by the displacement filter (anti-perfection) */}
        <g filter={`url(#wear-${uid})`}>
          <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} rx={rx} fill="none" stroke={`url(#wbb-${uid})`} strokeWidth={band} vectorEffect="non-scaling-stroke" />
        </g>
        {/* inner hard step where the metal meets the recess */}
        <rect x={innerX} y={innerX} width={w - innerX * 2} height={h - innerX * 2} rx={Math.max(2, rx - 1)} fill="none" stroke="rgba(1,3,6,0.8)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
};

/* ── B · Sloped Walls (mitred trapezoids — one geometry) ─────────── */

export const SlopedWalls: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  // Foreshortened wall depths under a top-light: the top wall shows tallest,
  // sides medium, bottom shortest (research: uniform depths read as a flat
  // vignette; foreshortening is what reads as a real cut).
  const T = 8, L = 5, R = 5, B = 3;
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg
        className="mp-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x={L} y={T} width={w - L - R} height={h - T - B} rx={4} />
          </clipPath>
          {/* userSpace gradients: each wall shades rim→floor. Darks are
              azure-black (hue≈210), lights are warm gold — never grey. */}
          <linearGradient id={`wt-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={T}>
            <stop offset="0%" stopColor="rgba(1,4,8,0.92)" />
            <stop offset="100%" stopColor="rgba(1,4,8,0.2)" />
          </linearGradient>
          <linearGradient id={`wl-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={L} y2="0">
            <stop offset="0%" stopColor="rgba(1,4,8,0.85)" />
            <stop offset="100%" stopColor="rgba(1,4,8,0.18)" />
          </linearGradient>
          <linearGradient id={`wb-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={h} x2="0" y2={h - B}>
            <stop offset="0%" stopColor="rgba(224,178,66,0.38)" />
            <stop offset="100%" stopColor="rgba(224,178,66,0.06)" />
          </linearGradient>
          <linearGradient id={`wr-${uid}`} gradientUnits="userSpaceOnUse" x1={w} y1="0" x2={w - R} y2="0">
            <stop offset="0%" stopColor="rgba(224,178,66,0.24)" />
            <stop offset="100%" stopColor="rgba(224,178,66,0.04)" />
          </linearGradient>
          <linearGradient id={`drop-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={T} x2="0" y2={T + 7}>
            <stop offset="0%" stopColor="rgba(0,3,7,0.55)" />
            <stop offset="100%" stopColor="rgba(0,3,7,0)" />
          </linearGradient>
        </defs>

        {/* interior: floor + azure LIFT (the lift is what funds the walls'
            darkness — without it dark walls have no luminance to remove) */}
        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          <rect x={L} y={T} width={w - L - R} height={h - T - B} fill="rgba(30,58,80,0.13)" />
          {/* static micro-grain so the interior isn't machine-perfect */}
          <rect x="0" y="0" width={w} height={h} fill="#0b1620" filter="url(#bronze-ws-f-fs)" opacity="0.28" />
          {/* contact shadow the rim casts onto the lifted floor */}
          <rect x={L} y={T} width={w - L - R} height="7" fill={`url(#drop-${uid})`} />
        </g>

        {/* THE walls: four mitred trapezoids sharing vertices — one geometry,
            asymmetric depths, 45° miters meet perfectly (no doubled lines) */}
        <polygon points={`0,0 ${w},0 ${w - R},${T} ${L},${T}`} fill={`url(#wt-${uid})`} />
        <polygon points={`0,0 ${L},${T} ${L},${h - B} 0,${h}`} fill={`url(#wl-${uid})`} />
        <polygon points={`0,${h} ${L},${h - B} ${w - R},${h - B} ${w},${h}`} fill={`url(#wb-${uid})`} />
        <polygon points={`${w},0 ${w},${h} ${w - R},${h - B} ${w - R},${T}`} fill={`url(#wr-${uid})`} />

        {/* miter seams: faint 45° facet hairlines at the corners — the chisel
            cuts, echoing the notched-plaque language */}
        <path d={`M 0,0 L ${L},${T} M ${w},0 L ${w - R},${T} M 0,${h} L ${L},${h - B} M ${w},${h} L ${w - R},${h - B}`} stroke="rgba(2,6,10,0.45)" strokeWidth="0.75" fill="none" />

        {/* rim break lines: hard dark crease where the surface tears (top/left),
            a solid gold kiss where the cut edge catches light (bottom/right) */}
        <path d={`M 0.5,${h - 1} L 0.5,0.5 L ${w - 1},0.5`} fill="none" stroke="rgba(2,5,9,0.7)" strokeWidth="1" />
        <path d={`M ${w - 0.5},1 L ${w - 0.5},${h - 0.5} L 1,${h - 0.5}`} fill="none" stroke="rgba(240,207,106,0.32)" strokeWidth="1" />
        {/* inner lip catching light at the bottom of the well */}
        <rect x={L + 1} y={h - B - 1.5} width={w - L - R - 2} height="1" fill="rgba(240,207,106,0.3)" />

        {/* the floor's cut edge just below the opening — research: the single
            strongest surviving recess cue on near-black */}
        <line x1={3} y1={h + 1} x2={w - 3} y2={h + 1} stroke="rgba(223,184,87,0.17)" strokeWidth="1" />
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── C · Obsidian Inlay (polished material change) ───────────────── */

const ObsidianInlay: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg className="mp-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx={RX - 1} />
          </clipPath>
          {/* polished-stone sheen: one cool diagonal band, upper third */}
          <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0.9">
            <stop offset="0%" stopColor="rgba(140,220,255,0)" />
            <stop offset="22%" stopColor="rgba(140,220,255,0.055)" />
            <stop offset="34%" stopColor="rgba(140,220,255,0)" />
            <stop offset="70%" stopColor="rgba(240,207,106,0)" />
            <stop offset="86%" stopColor="rgba(240,207,106,0.028)" />
            <stop offset="100%" stopColor="rgba(240,207,106,0)" />
          </linearGradient>
          <radialGradient id={`pool-${uid}`} cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(0,4,8,0)" />
            <stop offset="100%" stopColor="rgba(0,4,8,0.8)" />
          </radialGradient>
        </defs>

        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          <rect x="0" y="0" width={w} height={h} fill={`url(#sheen-${uid})`} />
          {/* pooled-glass corners: the polish darkens where it curves away */}
          <rect x="0" y="0" width={w} height={h} fill={`url(#pool-${uid})`} />
        </g>

        {/* incised seat: dark cut + bronze edge — the inlay's setting */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={RX} fill="none" stroke="rgba(120,84,26,0.55)" strokeWidth="1" />
        <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx={RX - 1} fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="1" />
        {/* light kissing the bottom edge of the polished tile */}
        <path d={`M ${w - 3},${h - 1.5} L ${RX},${h - 1.5}`} fill="none" stroke="rgba(240,207,106,0.2)" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── D · Engraved Filet (double gilded line + corner diamonds) ───── */

const EngravedFilet: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  const G = 4.5; // inner line inset
  const diamonds = [
    [G + 4, G + 4],
    [w - G - 4, G + 4],
    [G + 4, h - G - 4],
    [w - G - 4, h - G - 4],
  ] as const;
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg className="mp-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x="1" y="1" width={w - 2} height={h - 2} rx={RX} />
          </clipPath>
          <linearGradient id={`drop-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,3,8,0.5)" />
            <stop offset="100%" stopColor="rgba(0,3,8,0)" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          <rect x="1" y="1" width={w - 2} height="7" fill={`url(#drop-${uid})`} />
        </g>

        {/* the double filet: outer hairline · dark groove · brighter inner hairline */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={RX} fill="none" stroke="rgba(223,184,87,0.3)" strokeWidth="1" />
        <rect x="2.5" y="2.5" width={w - 5} height={h - 5} rx={RX - 2} fill="none" stroke="rgba(0,0,0,0.62)" strokeWidth="2" />
        <rect x={G} y={G} width={w - G * 2} height={h - G * 2} rx={RX - 3.5} fill="none" stroke="rgba(240,207,106,0.48)" strokeWidth="1" />

        {/* corner diamonds — the Surface's DNA at well scale */}
        {diamonds.map(([cx, cy], i) => (
          <g key={i}>
            <polygon
              points={`${cx},${cy - 3.2} ${cx + 3.2},${cy} ${cx},${cy + 3.2} ${cx - 3.2},${cy}`}
              fill="rgba(20,12,4,0.9)"
              stroke="rgba(223,184,87,0.55)"
              strokeWidth="0.8"
            />
            <polygon points={`${cx},${cy - 3.2} ${cx + 3.2},${cy} ${cx},${cy}`} fill="rgba(240,207,106,0.3)" />
          </g>
        ))}
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── registry ────────────────────────────────────────────────────── */

export const PLATE_VARIANTS: {
  key: string;
  label: string;
  Component: React.FC<PlateVariantProps>;
}[] = [
  { key: 'bezel', label: 'A · Bezel Molding', Component: BezelMolding },
  { key: 'walls', label: 'B · Sloped Walls', Component: SlopedWalls },
  { key: 'inlay', label: 'C · Obsidian Inlay', Component: ObsidianInlay },
  { key: 'filet', label: 'D · Engraved Filet', Component: EngravedFilet },
];
