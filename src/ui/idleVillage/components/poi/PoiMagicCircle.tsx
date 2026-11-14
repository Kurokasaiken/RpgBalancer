import React, { useId, useMemo } from 'react';
import { POI_MATERIC_V4_TOKENS as T4 } from '@/balancing/config/idleVillage/poiMatericV4Tokens';

/**
 * PoiMagicCircle — the sigillo's «halo» extracted as a standalone ring
 * (port of the magic-circle render inside `PoiMatericV3_5`, which stays
 * untouched because the sigillo component is trusted).
 *
 * Time writes a ring of runic letters around the piece: twin glowing rails,
 * a liquid head bead, cardinal sparks and a band of arcane glyphs that
 * appear one by one with the written share. The whole halo is tinted by
 * `tone` — on Zanara that's the family colour (emerald job / sapphire
 * quest), switching to the urgent vermilion past the deadline threshold.
 *
 * Sweep grammar (same as the sigillo): `sweep = +1` writes clockwise from
 * 12 o'clock (job filling with elapsed time), `−1` writes counter-clockwise
 * (quest residual draining). At equal fractions the two rings are specular.
 *
 * Rendered on an 86×86 viewBox centred at (43,43); the caller sizes it so
 * the outer rail (r = 54 units) lands on the desired radius.
 */

export interface PoiMagicCircleProps {
  /** Written share of the ring 0..1 (elapsed for job, remaining for quest). */
  progress: number;
  /** +1 writes clockwise from 12 (job), −1 counter-clockwise (quest drain). */
  sweep: 1 | -1;
  /** Halo tone — the family colour; urgency is applied by passing urgentTone. */
  tone: string;
  /** Rune ink — the glyphs' stroke colour (defaults to a lightened tone). */
  runeColor?: string;
  /** When true the whole halo lands in `urgentTone` (urgency lands once, never pulses). */
  urgent?: boolean;
  /** Vermilion for the urgent state. */
  urgentTone?: string;
  /** Angular sectors (deg, 0 = 12 o'clock, CW) masked out of the ring — the
   *  punte/jewels live there; the runes «partono dai gioielli» only. Ranges
   *  may wrap past 360. */
  gaps?: ReadonlyArray<readonly number[]>;
  'data-testid'?: string;
}

/** -1 writes counter-clockwise from twelve o'clock, +1 clockwise. */
type Sweep = -1 | 1;

interface SealLetter {
  d: string;
  angle: number;
  x: number;
  y: number;
  /** 0 at the liquid front, growing as the letter settles behind it. */
  age: number;
}

/** Inscription vocabulary — Maou Gakuin-inspired magical script (sigillo). */
const LETTERS: string[] = [
  'M -1.2,-5 L -1.2,5 M -1.2,-1.8 Q 2,-2.8 2,-0.5 Q 2,1.5 -1.2,0.8',
  'M -1.5,-5 L -1.5,5 M -1.5,-2.2 Q 1.5,-2.2 1.5,0.2 Q 1.5,2 -0.8,2.8 M 1.8,3.2 A 0.9 0.9 0 1 1 1.8 4.9 A 0.9 0.9 0 1 1 1.8 3.2',
  'M -3,-5 L -3,5 M 3,-5 L 3,5 M -3,-3 Q 0,-5.2 3,-3',
  'M 0,-2.2 A 2 2 0 1 1 0 1.8 A 2 2 0 1 1 0 -2.2 M -1.6,0.6 Q -2.2,2.8 -2.8,4.5 M 1.6,0.6 Q 2.2,2.8 2.8,4.5',
  'M -2.8,-4.5 Q -0.8,-1.5 1.2,-2.5 Q 3.2,-3.5 2.8,-0.5 Q 2.4,2.5 -1.2,2.5 Q -3.2,2.5 -2.8,4.5',
  'M -0.5,2 L -0.5,5 M 0,-2 A 2.2 2.2 0 1 1 -0.1 -2 M -0.5,1.6 Q -2,0.5 -2,-1.5',
  'M -3,-4.5 L 3,-4.5 M 0,-4.5 L 0,5 M 0,0 Q 2,0.5 2,2.5',
  'M -3,-4 L 3,-4 Q 3.6,0 0,2 Q -3.6,4 -3,0.5 Q -2.6,-2.5 0,-2.5',
  'M -3,-5 Q 0,-1 3,-5 M -3,0 Q 0,3 3,0 M -3,0 L 3,0',
  'M -3,-5 Q 0,-2 3,0 Q 0,2 -3,5',
  'M -2.5,-5 L 2.5,5 M 2.5,-5 L -2.5,5 M -1.2,-2 A 0.8 0.8 0 1 1 -1.2 -0.4 A 0.8 0.8 0 1 1 -1.2 -2',
  'M -2.2,-1.5 L 2.2,-1.5 Q 2.2,3.5 0,3.5 Q -2.2,3.5 -2.2,-1.5 M -1,-4.2 A 0.7 0.7 0 1 1 -1 -2.8 A 0.7 0.7 0 1 1 -1 -4.2 M 1,-4.2 A 0.7 0.7 0 1 1 -1 -2.8 A 0.7 0.7 0 1 1 1 -4.2',
];

const WAKE_STEPS = [0, 0.35, 0.62, 0.82, 0.94];

/* Solid band geometry (viewBox units): centred between the old rail radii,
 *  wide enough to cover the whole annulus they used to bracket. */
const BAND_R = (T4.geometry.sealOuterRail + T4.geometry.sealInnerRail) / 2;
const BAND_W = T4.geometry.sealOuterRail - T4.geometry.sealInnerRail + T4.seal.railWidth;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Mix a #rrggbb colour toward white — the crisp core of a halo is a lighter shade of its tone. */
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Split a hex colour into the 0..1 channels an feColorMatrix expects. */
function channels(hex: string): [string, string, string] {
  const n = parseInt(hex.slice(1), 16);
  return [
    (((n >> 16) & 255) / 255).toFixed(3),
    (((n >> 8) & 255) / 255).toFixed(3),
    ((n & 255) / 255).toFixed(3),
  ];
}

function sealPoint(radius: number, fraction: number, sweep: Sweep): [number, number] {
  const { center } = T4.geometry;
  const rad = ((-90 + sweep * Math.min(fraction, 0.999) * 360) * Math.PI) / 180;
  return [center + radius * Math.cos(rad), center + radius * Math.sin(rad)];
}

function sealArcSpan(radius: number, from: number, to: number, sweep: Sweep): string {
  const [x1, y1] = sealPoint(radius, from, sweep);
  const [x2, y2] = sealPoint(radius, to, sweep);
  const large = (Math.min(to, 0.999) - from) * 360 > 180 ? 1 : 0;
  const flag = sweep > 0 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} ${flag} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function sealArcPath(radius: number, written: number, sweep: Sweep): string {
  return sealArcSpan(radius, 0, written, sweep);
}

/** Pie-slice path (centre 43, radius 95) covering angles a0..a1 deg (0 = 12, CW). */
function gapWedge(a0: number, a1: number): string {
  const pt = (deg: number): string => {
    const rad = (deg * Math.PI) / 180;
    return `${(43 + 95 * Math.sin(rad)).toFixed(2)} ${(43 - 95 * Math.cos(rad)).toFixed(2)}`;
  };
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M 43 43 L ${pt(a0)} A 95 95 0 ${large} 1 ${pt(a1)} Z`;
}

/** Deterministic per-letter hash (0..1) — the inscription must look hand-
 *  scribed, so each glyph jitters in radius, angle and rotation (Director
 *  ruling 2026-11-14: «le scritte devono essere sfalsate»). */
const letterJitter = (i: number, salt: number): number => {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function buildBand(radius: number, half: boolean, written: number, sweep: Sweep): SealLetter[] {
  const { center } = T4.geometry;
  const step = 360 / T4.seal.letterCount;
  const out: SealLetter[] = [];
  for (let i = 0; i < T4.seal.letterCount; i++) {
    const age = written - i;
    if (age <= 0) break;
    const rJ = (letterJitter(i, half ? 7 : 3) - 0.5) * 2.6;      // ±1.3 units radial
    const aJ = (letterJitter(i, half ? 11 : 5) - 0.5) * step * 0.45; // ±0.22 step angular
    const rotJ = (letterJitter(i, half ? 13 : 9) - 0.5) * 20;     // ±10° rotation
    const angle = -90 + sweep * (i + (half ? 0.5 : 0)) * step + sweep * aJ;
    const rad = (angle * Math.PI) / 180;
    const rr = radius + rJ;
    out.push({
      d: LETTERS[i % LETTERS.length],
      angle: angle + rotJ,
      x: center + rr * Math.cos(rad),
      y: center + rr * Math.sin(rad),
      age,
    });
  }
  return out;
}

export const PoiMagicCircle: React.FC<PoiMagicCircleProps> = ({
  progress,
  sweep,
  tone,
  runeColor,
  urgent = false,
  urgentTone,
  gaps,
  'data-testid': testId,
}) => {
  const uid = useId();
  const gid = (id: string) => `${uid}-${id}`;

  const sealProgress = clamp01(progress);
  const haloTone = urgent && urgentTone ? urgentTone : tone;
  const sealLight = haloTone;
  const sealMid = runeColor ?? haloTone;
  const sealInk = runeColor ?? lighten(haloTone, 0.55);
  const [gr, gg, gb] = channels(haloTone);

  const upperBand = useMemo(
    () => buildBand(T4.geometry.sealUpperBand, false, sealProgress * T4.seal.letterCount, sweep),
    [sealProgress, sweep],
  );
  const lowerBand = useMemo(
    () => buildBand(T4.geometry.sealLowerBand, true, sealProgress * T4.seal.letterCount, sweep),
    [sealProgress, sweep],
  );

  const cardinals = useMemo(
    () =>
      T4.cardinals.fractions.map((fraction) => {
        const crossed = sealProgress - fraction;
        const [x, y] = sealPoint(T4.cardinals.radius, fraction, sweep);
        return {
          fraction,
          x,
          y,
          lit: clamp01(crossed / T4.cardinals.riseSpan),
          flare: crossed >= 0 ? clamp01(1 - crossed / T4.cardinals.flareSpan) : 0,
        };
      }),
    [sealProgress, sweep],
  );

  const headPoint = useMemo(() => {
    const [x, y] = sealPoint(
      (T4.geometry.sealOuterRail + T4.geometry.sealInnerRail) / 2,
      sealProgress,
      sweep,
    );
    return { x, y };
  }, [sealProgress, sweep]);

  const flare = (age: number) => clamp01(1 - age / T4.seal.flow.flareLetters);
  const reveal = (age: number) => clamp01(age);
  const wakeStart = Math.max(0, sealProgress - sealProgress * T4.seal.flow.wakeFraction);
  const headStart = Math.max(0, sealProgress - sealProgress * T4.seal.flow.headFraction);

  if (sealProgress <= 0.001) return null;

  return (
    <svg
      viewBox="-20 -20 126 126"
      width="100%"
      height="100%"
      aria-hidden="true"
      data-testid={testId}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <defs>
        {/* Meniscus bead at the liquid head. */}
        <radialGradient id={gid('bead')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={sealInk} stopOpacity="0.95" />
          <stop offset="45%" stopColor={sealLight} stopOpacity="0.55" />
          <stop offset="100%" stopColor={sealMid} stopOpacity="0" />
        </radialGradient>
        {/* Bloom: derived from SourceAlpha so it never inherits the ink. */}
        <filter
          id={gid('bloom')}
          x="-120%"
          y="-120%"
          width="340%"
          height="340%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation={T4.bloom.radii[0]} result="b1" />
          <feGaussianBlur in="SourceAlpha" stdDeviation={T4.bloom.radii[1]} result="b2" />
          <feGaussianBlur in="SourceAlpha" stdDeviation={T4.bloom.radii[2]} result="b3" />
          <feMerge result="halo">
            <feMergeNode in="b3" />
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
          </feMerge>
          <feColorMatrix
            in="halo"
            type="matrix"
            result="tint"
            values={`0 0 0 0 ${gr} 0 0 0 0 ${gg} 0 0 0 0 ${gb} 0 0 0 ${T4.bloom.strength} 0`}
          />
          <feMerge>
            <feMergeNode in="tint" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Punta sectors: the rune ring is simply not drawn there — the
         *  jewels own those coordinates (Director ruling 2026-11-13). */}
        <mask id={gid('nogaps')} maskUnits="userSpaceOnUse" x="-30" y="-30" width="146" height="146">
          <rect x="-30" y="-30" width="146" height="146" fill="#ffffff" />
          {gaps?.map((g, i) => <path key={i} d={gapWedge(g[0] ?? 0, g[1] ?? 0)} fill="#000000" />)}
        </mask>
      </defs>

      {/* No dark backing track: on the painted frame the sigillo's dark rail
       *  reads as black scribble (Director ruling 2026-11-13). */}

      <g mask={gaps && gaps.length > 0 ? `url(#${gid('nogaps')})` : undefined}>
      <g filter={`url(#${gid('bloom')})`}>
        {/* Single solid band (Director ruling 2026-11-14: «una riga intera
         *  con le scritte sopra, non due righe piccole») — spans the same
         *  radial zone the twin rails used to bracket. */}
        <path
          className="poi-band"
          d={sealArcPath(BAND_R, sealProgress, sweep)}
          fill="none"
          stroke={sealLight}
          strokeOpacity={T4.seal.flow.settledOpacity}
          strokeWidth={BAND_W}
          strokeLinecap="butt"
        />
        {WAKE_STEPS.map((step, i) => (
          <path
            className="poi-band"
            key={`wake-${i}`}
            d={sealArcSpan(BAND_R, wakeStart + (sealProgress - wakeStart) * step, sealProgress, sweep)}
            fill="none"
            stroke={sealLight}
            strokeOpacity={0.16}
            strokeWidth={BAND_W}
            strokeLinecap="butt"
          />
        ))}
        <path
          className="poi-band"
          d={sealArcSpan(BAND_R, headStart, sealProgress, sweep)}
          fill="none"
          stroke={sealLight}
          strokeWidth={BAND_W * 1.05}
          strokeLinecap="butt"
        />
        {cardinals.map(
          (c) =>
            c.lit > 0.001 && (
              <g
                key={`card-halo-${c.fraction}`}
                transform={`translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${T4.cardinals.scale})`}
                opacity={
                  (T4.cardinals.settledOpacity + (1 - T4.cardinals.settledOpacity) * c.flare) * c.lit
                }
              >
                <path d={T4.cardinals.path} fill={sealLight} />
              </g>
            ),
        )}
        {sealProgress < 0.999 && (
          <circle cx={headPoint.x} cy={headPoint.y} r={T4.seal.flow.headRadius} fill={`url(#${gid('bead')})`} />
        )}
        {[...upperBand, ...lowerBand].map((l, i) => (
          <g className="poi-rune" key={`halo-${i}`} transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.angle.toFixed(1)})`}>
            <g transform={`scale(${T4.seal.letterScale})`}>
              <path
                d={l.d}
                fill="none"
                stroke={sealMid}
                strokeOpacity={
                  (T4.seal.flow.settledOpacity + (1 - T4.seal.flow.settledOpacity) * flare(l.age)) *
                  reveal(l.age)
                }
                strokeWidth={T4.seal.letterWidth * (1 + 0.45 * flare(l.age))}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        ))}
      </g>

      {/* Crisp ink pass on top of the bloom: same solid band, then the
       *  runes ride ON it in rune ink. */}
      <g>
        <path
          className="poi-band"
          d={sealArcPath(BAND_R, sealProgress, sweep)}
          fill="none"
          stroke={sealLight}
          strokeWidth={BAND_W}
          strokeLinecap="butt"
        />
        {cardinals.map(
          (c) =>
            c.lit > 0.001 && (
              <g
                key={`card-core-${c.fraction}`}
                transform={`translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${T4.cardinals.coreScale})`}
                opacity={c.lit}
              >
                <path d={T4.cardinals.path} fill={sealInk} />
              </g>
            ),
        )}
        {[...upperBand, ...lowerBand].map((l, i) => (
          <g className="poi-rune" key={`core-${i}`} transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.angle.toFixed(1)})`}>
            <g transform={`scale(${T4.seal.letterScale})`}>
              <path
                d={l.d}
                fill="none"
                stroke={sealInk}
                strokeOpacity={(0.9 + 0.1 * flare(l.age)) * reveal(l.age)}
                strokeWidth={T4.seal.coreLetterWidth * 1.25 * (1 + 0.3 * flare(l.age))}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        ))}
      </g>
      </g>
    </svg>
  );
};

export default PoiMagicCircle;
