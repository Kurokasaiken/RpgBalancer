/**
 * mappa2 look-dev grade: teal & orange palette + warm highlights / cool shadows, expressed as an SVG filter
 * applied to the Pixi canvas with CSS (no world-sized Pixi filter: it renders off-screen at low resolution and
 * blurs, see the time-of-day wash in PixiWorldMap). Look-dev only: the delivery path is baking the same numbers
 * into the painting (PLAN-089 T-013), because url() filters are not guaranteed to be GPU-accelerated in every WebView.
 *
 * Numbers come from the offline gallery (`.mw/runs/20261029-mappa2-grade-fork`): `PALETTE_MATRIX` is the least-squares
 * fit from the painted colours to the mockup colours with neutral greys pinned.
 */

export interface Mappa2Grade {
  enabled: boolean;
  /** 0 = painted palette, 1 = fitted teal & orange palette. */
  palette: number;
  /** 0-1 warm push on the lights (amber). */
  warm: number;
  /** 0-1 cool push on the shadows (blue-violet). */
  coolShadows: number;
  /** CSS saturate() multiplier. */
  saturation: number;
  /** CSS contrast() multiplier. */
  contrast: number;
  /** 0-1 opacity of the baked northern-rock shade (PixiWorldMap `mountainShade`). */
  mountainShade: number;
  /** 0-1 opacity of the baked sapphire sea (PixiWorldMap `seaGrade`). */
  seaSapphire: number;
}

export const DEFAULT_MAPPA2_GRADE: Mappa2Grade = {
  enabled: false, // the look-dev filter would grade the sapphire sea a second time: off by default, still available in the panel
  palette: 1,
  warm: 0.6,
  coolShadows: 0.6,
  saturation: 1.15,
  contrast: 1.06,
  mountainShade: 1,
  seaSapphire: 1,
};

/** Live object handed to PixiWorldMap; the controls mutate `opacity`, the map reads it every tick (no rebuild). */
export const mountainShadeLive = { url: '/assets/world/mappa2/base/fx/mountain-shade.webp', opacity: DEFAULT_MAPPA2_GRADE.mountainShade };

/** Live object handed to PixiWorldMap, same pattern as `mountainShadeLive`. */
export const seaGradeLive = {
  multUrl: '/assets/world/mappa2/base/fx/sea-sapphire-mult.webp',
  addUrl: '/assets/world/mappa2/base/fx/sea-sapphire-add.webp',
  opacity: DEFAULT_MAPPA2_GRADE.seaSapphire,
};

/** Rows R', G', B' over [R, G, B, 1]. Greys stay grey (rows sum to ~1 with ~0 offset). */
export const PALETTE_MATRIX: readonly (readonly number[])[] = [
  [0.993, 0.027, -0.01, -0.004],
  [0.143, 0.811, 0.06, -0.014],
  [0.324, -0.36, 1.061, -0.029],
];

export const GRADE_FILTER_ID = 'mappa2-grade-filter';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const fmt = (n: number) => String(Math.round(n * 10000) / 10000);

/** feColorMatrix `values` (4x5) blending identity toward the fitted palette by `palette`. */
export function paletteMatrixValues(palette: number): string {
  const k = clamp01(palette);
  const rows = PALETTE_MATRIX.map((row, i) => {
    const m = row.slice(0, 3).map((v, j) => (i === j ? 1 : 0) + (v - (i === j ? 1 : 0)) * k);
    const off = row[3] * k;
    return `${m.map(fmt).join(' ')} 0 ${fmt(off)}`;
  });
  return `${rows.join('  ')}  0 0 0 1 0`;
}

/** feComponentTransfer tableValues per channel: 5-point curves, identity plus split-toning offsets. */
export function toneTables(warm: number, coolShadows: number): { r: string; g: string; b: string } {
  const w = clamp01(warm);
  const c = clamp01(coolShadows);
  const x = [0, 0.25, 0.5, 0.75, 1];
  // weight of each control point: shadows bite at the low end, lights at the high end
  const lo = [1, 0.7, 0.15, 0, 0];
  const hi = [0, 0, 0.15, 0.7, 1];
  const curve = (dRedHi: number, dRedLo: number) =>
    x.map((v, i) => clamp01(v + w * dRedHi * hi[i] + c * dRedLo * lo[i]));
  return {
    r: curve(0.035, -0.012).map(fmt).join(' '),
    g: curve(0.012, -0.004).map(fmt).join(' '),
    b: curve(-0.045, 0.03).map(fmt).join(' '),
  };
}

/** Inner markup of the SVG filter for a grade. */
export function gradeFilterMarkup(g: Mappa2Grade): string {
  const t = toneTables(g.warm, g.coolShadows);
  return (
    `<filter id="${GRADE_FILTER_ID}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">` +
    `<feColorMatrix type="matrix" values="${paletteMatrixValues(g.palette)}"/>` +
    `<feComponentTransfer>` +
    `<feFuncR type="table" tableValues="${t.r}"/>` +
    `<feFuncG type="table" tableValues="${t.g}"/>` +
    `<feFuncB type="table" tableValues="${t.b}"/>` +
    `</feComponentTransfer></filter>`
  );
}

/** CSS `filter` value for the canvas ('' when disabled). */
export function gradeCssFilter(g: Mappa2Grade): string {
  if (!g.enabled) return '';
  return `url(#${GRADE_FILTER_ID}) saturate(${fmt(g.saturation)}) contrast(${fmt(g.contrast)})`;
}
