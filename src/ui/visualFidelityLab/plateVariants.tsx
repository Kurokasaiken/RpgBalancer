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

const BezelMolding: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  const BAND = 5; // molding thickness
  const inset = BAND / 2 + 1;
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg className="mp-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x={BAND + 1} y={BAND + 1} width={w - (BAND + 1) * 2} height={h - (BAND + 1) * 2} rx={RX - 4} />
          </clipPath>
          {/* one molding band, painted like an artist paints a frame:
              lit crest → body → core shadow, top to bottom */}
          <linearGradient id={`band-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8c06a" />
            <stop offset="30%" stopColor="#b0803a" />
            <stop offset="65%" stopColor="#7a5218" />
            <stop offset="100%" stopColor="#3d2508" />
          </linearGradient>
          <linearGradient id={`drop-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,3,8,0.6)" />
            <stop offset="100%" stopColor="rgba(0,3,8,0)" />
          </linearGradient>
        </defs>

        {/* dark seat line so the molding separates from the field */}
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx={RX} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
        {/* THE molding: one band, one vertical light */}
        <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} rx={RX - 2} fill="none" stroke={`url(#band-${uid})`} strokeWidth={BAND} />
        {/* inner step edge (hard) */}
        <rect x={BAND + 1} y={BAND + 1} width={w - (BAND + 1) * 2} height={h - (BAND + 1) * 2} rx={RX - 4} fill="none" stroke="rgba(1,3,6,0.8)" strokeWidth="1" />

        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          {/* contact shadow the molding casts into the well */}
          <rect x={BAND + 1} y={BAND + 1} width={w - (BAND + 1) * 2} height="8" fill={`url(#drop-${uid})`} />
          {/* light escaping at the bottom inner lip */}
          <rect x={BAND + 2} y={h - BAND - 2.5} width={w - (BAND + 2) * 2} height="1" fill="rgba(240,207,106,0.22)" />
        </g>
      </svg>
      <div className="mp-content">{children}</div>
    </div>
  );
};

/* ── B · Sloped Walls (mitred trapezoids — one geometry) ─────────── */

const SlopedWalls: React.FC<PlateVariantProps> = ({ children, className, style }) => {
  const { ref, w, h } = usePlateSize();
  const uid = useId().replace(/:/g, '');
  const D = 4; // wall depth
  return (
    <div ref={ref} className={`mp-root ${className ?? ''}`.trim()} style={style}>
      <svg className="mp-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`clip-${uid}`}>
            <rect x={D} y={D} width={w - D * 2} height={h - D * 2} rx={RX - 3} />
          </clipPath>
          {/* userSpace gradients so each wall shades rim→floor exactly */}
          <linearGradient id={`wt-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={D}>
            <stop offset="0%" stopColor="rgba(0,2,5,0.92)" />
            <stop offset="100%" stopColor="rgba(0,2,5,0.28)" />
          </linearGradient>
          <linearGradient id={`wl-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={D} y2="0">
            <stop offset="0%" stopColor="rgba(0,2,5,0.86)" />
            <stop offset="100%" stopColor="rgba(0,2,5,0.24)" />
          </linearGradient>
          <linearGradient id={`wb-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={h} x2="0" y2={h - D}>
            <stop offset="0%" stopColor="rgba(214,164,56,0.34)" />
            <stop offset="100%" stopColor="rgba(214,164,56,0.05)" />
          </linearGradient>
          <linearGradient id={`wr-${uid}`} gradientUnits="userSpaceOnUse" x1={w} y1="0" x2={w - D} y2="0">
            <stop offset="0%" stopColor="rgba(214,164,56,0.24)" />
            <stop offset="100%" stopColor="rgba(214,164,56,0.04)" />
          </linearGradient>
          <linearGradient id={`drop-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,2,6,0.5)" />
            <stop offset="100%" stopColor="rgba(0,2,6,0)" />
          </linearGradient>
        </defs>

        {/* floor first */}
        <g clipPath={`url(#clip-${uid})`}>
          <Floor w={w} h={h} uid={uid} />
          <rect x={D} y={D} width={w - D * 2} height="7" fill={`url(#drop-${uid})`} />
        </g>

        {/* THE walls: four mitred trapezoids sharing vertices — one geometry,
            45° corners meet perfectly, no doubled lines */}
        <polygon points={`0,0 ${w},0 ${w - D},${D} ${D},${D}`} fill={`url(#wt-${uid})`} />
        <polygon points={`0,0 ${D},${D} ${D},${h - D} 0,${h}`} fill={`url(#wl-${uid})`} />
        <polygon points={`0,${h} ${D},${h - D} ${w - D},${h - D} ${w},${h}`} fill={`url(#wb-${uid})`} />
        <polygon points={`${w},0 ${w},${h} ${w - D},${h - D} ${w - D},${D}`} fill={`url(#wr-${uid})`} />

        {/* rim break lines: dark where the surface tears (top/left), a kiss of
            gold where the edge catches light (bottom/right) */}
        <path d={`M 0.5,${h - 2} L 0.5,${RX} Q 0.5,0.5 ${RX},0.5 L ${w - 2},0.5`} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1" />
        <path d={`M ${w - 0.5},2 L ${w - 0.5},${h - RX} Q ${w - 0.5},${h - 0.5} ${w - RX},${h - 0.5} L 2,${h - 0.5}`} fill="none" stroke="rgba(240,207,106,0.3)" strokeWidth="1" />
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
