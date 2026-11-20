/**
 * PLAN-127 `<surface>Frame` manifest contract — the TypeScript shape of the
 * manifest emitted by `scripts/hud-real/slice-frame.py` (JSON in the asset
 * dir + generated `<surface>Frame.ts` module under `src/generated/slicekit/`).
 *
 * The manifest is the single source of truth for slice-kit render geometry
 * (OB-2): the frame primitive consumes it — no piece size, offset or span is
 * hand-maintained in components.
 */

/** Piece roles emitted by the slicer (PLAN-127 §3 spec). */
export type SliceKitRole = 'corner' | 'edge-x' | 'edge-y' | 'ornament';

/** Anchor contract per role: corners tl|tr|bl|br, edge-x top|bottom,
 *  edge-y left|right, ornaments any edge anchor or `explicit`. */
export type SliceKitAnchor =
  | 'tl' | 'tr' | 'bl' | 'br'
  | 'top' | 'bottom' | 'left' | 'right'
  | 'explicit';

/** CSS offset value carried by the manifest: px number or CSS string
 *  (e.g. `"16%"` for an ornament anchored across an edge). */
export type SliceKitCssValue = number | string;

/**
 * Authored placement for corner|ornament pieces — CSS offsets from the panel
 * rect the frame wraps (negative = outside the panel, the ruled "frame
 * rides out" composition). Not derivable from the golden: the frame5 set
 * has no cutout hole to compute a `holeCornerPx` from, so the placement is
 * autorial data like the crop rects.
 */
export interface SliceKitPiecePos {
  left?: SliceKitCssValue;
  right?: SliceKitCssValue;
  top?: SliceKitCssValue;
  bottom?: SliceKitCssValue;
}

/**
 * One emitted piece (`<id>.webp`) with the render datums the primitive
 * needs. `nativeSize` is the emitted crop px; `displaySize` the CSS px the
 * piece renders at — always emitted (explicit, or native × displayScale, or
 * native when unscaled).
 */
export interface SliceKitManifestPiece {
  /** Slice id from the spec (also the file stem). */
  id: string;
  /** Emitted file name inside {@link SliceKitFrameManifest.assetBase}. */
  file: string;
  role: SliceKitRole;
  anchor: SliceKitAnchor;
  /** `tile` = repeats on its edge axis (requires {@link tileSafe});
   *  `none` = fixed art — never stretched. */
  stretch: 'tile' | 'none';
  /** Emitted piece pixel size [w, h]. */
  nativeSize: [number, number];
  /** Emitted file size in bytes (budget evidence). */
  bytes?: number;
  /** PLAN-127 tile-safety approval flag — mandatory when `stretch:"tile"`. */
  tileSafe?: boolean;
  /** `hole-bound` pieces bound a runtime window (see `ctaWindow`/`windows`). */
  compositeMode?: 'static' | 'hole-bound';
  /** display px / native px — feeds the seam comparator's dispAbs backstop. */
  displayScale?: number;
  /** CSS px the piece renders at [w, h] — always present. */
  displaySize?: [number, number];
  /** Authored placement — corner|ornament only (edges derive the rim side). */
  pos?: SliceKitPiecePos;
  /** Edge-only [before, after] px the strip extends beyond the panel rect to
   *  tuck under the corner art (before = left/top end, after = right/bottom). */
  span?: [number, number];
  /** Variant tag list — the piece renders only when the active variant is
   *  listed (e.g. `emblem-chest` → `["corniciStash"]`). Absent = all variants. */
  variants?: string[];
  /** Corner pieces with a cutout hole: the local px that sits on the panel
   *  corner (emitted only when the spec declares `source.cutouts`). */
  holeCornerPx?: [number, number];
  /** Edge pieces with a cutout hole: which side faces the content and the
   *  hole line's offset inward from that side. */
  holeBoundary?: { side: string; offsetPx: number };
}

/**
 * DOM backfill patch ("corner-bite" contract): a solid rect anchored at a
 * panel corner, rendered behind the frame pieces to cover the crescent of
 * backdrop between the bands' inner rims and the plaque's rounded corner
 * arc. Pure data in the manifest — the primitive owns no hardcoded patch.
 */
export interface SliceKitBacking {
  anchor: 'tl' | 'tr' | 'bl' | 'br';
  /** Patch size in CSS px. */
  w: number;
  h: number;
  /** CSS `border-radius` following the plaque's corner arc. */
  radius?: string;
  /** `rect` (default) paints the whole box; `crescent` paints ONLY the wedge between the box's square
   *  corner and a quarter-circle of radius `min(w,h)` centred on the box's inner corner — i.e. the gap a
   *  rounded plaque leaves against a square frame — and leaves the plaque interior untouched. */
  shape?: 'rect' | 'crescent';
  /** Fill colour (spec data — the plaque/ground tone the wedge must match). */
  color: string;
}

/** Runtime-bound window for `compositeMode:"hole-bound"` surfaces — the
 *  primitive clips a live DOM element into it via clip-path/mask. */
export interface SliceKitWindow {
  id?: string;
  shape: 'rect' | 'sprite-mask';
  /** Window rect in outer-rect-relative px. */
  rect: [number, number, number, number];
  /** Fractional insets of the outer box — direct CSS `inset` values. */
  inset: { left: number; top: number; right: number; bottom: number };
  /** Generous transparent margin the slicer kept around the hole. */
  marginPx?: number;
  /** `sprite-mask`: emitted piece whose alpha is the clip silhouette. */
  maskRef?: string;
}

/** Generated `<surface>Frame` manifest (spec → slicer → manifest). */
export interface SliceKitFrameManifest {
  /** Spec surface id. */
  surface: string;
  specVersion: number;
  generator?: string;
  generatedAt?: string;
  /** Golden provenance (path + sha256) for the conversion record. */
  source?: { path: string; sha256?: string };
  /** Absolute URL base the piece `file`s resolve against (`/assets/…/`). */
  assetBase: string;
  pieces: SliceKitManifestPiece[];
  /** Frame-level render geometry (present when the spec declares geometry). */
  geometry?: {
    /** Frame art bbox on the source golden. */
    outer?: { x: number; y: number; w: number; h: number };
    /** Interior hole rect on the source (inside the inner filets). */
    contentRect?: { x: number; y: number; w: number; h: number };
    /** Source-px insets from outer to contentRect — provenance for the
     *  surface's content padding contract. */
    contentInsets?: { top: number; right: number; bottom: number; left: number };
    /** Px the frame's inner rim overlaps the panel edge (Director ruling ~1). */
    rimOverlapPx?: number;
    /** Native corner piece sizes by anchor. */
    corners?: Partial<Record<'tl' | 'tr' | 'bl' | 'br', { w: number; h: number }>>;
    /** Native edge thickness by anchor (height for x-edges, width for y). */
    edgeThickness?: Partial<Record<'top' | 'bottom' | 'left' | 'right', number>>;
    /** Corner-bite DOM backfills rendered behind the pieces. */
    backings?: SliceKitBacking[];
  };
  /** Single runtime-bound window (hole-bound surfaces, e.g. cassetto CTA). */
  ctaWindow?: SliceKitWindow;
  /** Multiple runtime-bound windows keyed by hole id. */
  windows?: Record<string, SliceKitWindow>;
}

/**
 * Interior clearance (px) a framed panel's first content row should keep below
 * the panel's TOP edge: how far the top-edge frame mass reaches inside the
 * panel rect — the band's inner rim plus the top corner knuckle wedges (their
 * authored `pos` + `displaySize` projected past the panel corner). Derived from
 * the manifest, never hand-tuned: a `thinFrameManifest` scales it down with the
 * rest of the geometry, so one call serves every candidate weight.
 *
 * R-362 note: only the TOP side needs the knuckle reach — the header row runs
 * corner-to-corner under both top wedges. The bottom corner sweeps are thin
 * painted curls hugging the edge (alpha-probe on the emitted pieces: ~10px at
 * BL, ~30px only within ~2px of the BR edge) and stay clear of the standard
 * `plaque-clearance + panel-padding` bottom inset; the side rims overlap ~1px.
 */
export function frameTopInsetPx(m: SliceKitFrameManifest): number {
  let top = m.geometry?.rimOverlapPx ?? 0;
  for (const p of m.pieces) {
    if (p.role !== 'corner' || typeof p.pos?.top !== 'number') continue;
    const h = p.displaySize?.[1] ?? p.nativeSize[1];
    top = Math.max(top, p.pos.top + h);
  }
  return top;
}

/**
 * Interior clearance (px) the top BAND's painted mass reaches inside the
 * panel rect — the edge-top tile's inner rim (`geometry.rimOverlapPx`),
 * WITHOUT the top-corner knuckle reach {@link frameTopInsetPx} adds.
 *
 * R-363 (Director: «meno spazio tra il testo e pulsanti e la frame su»):
 * the knuckle wedges' interior reach is almost entirely transparent at
 * display scale — alpha-probe on the emitted pieces (thin ×0.5) shows the
 * only opaque pixels below the band are the side braid columns, hugging
 * x ≤ 0 (TL) and x ≥ panel.w−1 (TR): outside the header's content band
 * (x 22…378 on a 400px panel). The BBOX-based inset therefore over-pads the
 * header; the content clearance that matters is the band's inner rim plus a
 * small token gap (`--skin-hud-frame-top`). Same manifest, same scale
 * behaviour — a `thinFrameManifest` scales `rimOverlapPx` with the rest.
 */
export function frameTopRimPx(m: SliceKitFrameManifest): number {
  return m.geometry?.rimOverlapPx ?? 0;
}

/**
 * Thinner copy of a frame manifest: every rendered size, offset and span is multiplied by ONE factor `k` (art and
 * proportions unchanged — only the DISPLAY scale of the pieces shrinks). Percentage offsets and the `variants` tags
 * are kept as they are. Used where a dense panel needs a finer frame (2026-11-19).
 *
 * One factor on purpose: the corner art contains a full-height section of the band, so a separate scale for the band
 * leaves a step at the corners; and each offset must be scaled EXACTLY once (an earlier version scaled the top
 * corners' `top` twice and left them 8px too low — the gems sat inside the frame instead of on its corner).
 */
export function thinFrameManifest(m: SliceKitFrameManifest, k: number): SliceKitFrameManifest {
  const sc = (v: number) => Math.round(v * k * 10) / 10;
  const scPos = (p?: SliceKitPiecePos): SliceKitPiecePos | undefined => {
    if (!p) return p;
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(p)) out[key] = typeof val === 'number' ? sc(val) : val;
    return out as SliceKitPiecePos;
  };
  return {
    ...m,
    pieces: m.pieces.map((p) => ({
      ...p,
      displaySize: p.displaySize ? ([sc(p.displaySize[0]), sc(p.displaySize[1])] as [number, number]) : p.displaySize,
      pos: scPos(p.pos),
      span: p.span ? ([sc(p.span[0]), sc(p.span[1])] as [number, number]) : p.span,
    })),
    geometry: m.geometry
      ? {
          ...m.geometry,
          rimOverlapPx: m.geometry.rimOverlapPx !== undefined ? sc(m.geometry.rimOverlapPx) : undefined,
          /* NOT scaled: the corner crescent fills the gap against the plaque's rounded corner (fixed 18px arc), which does
           * not shrink with the frame art. */
          backings: m.geometry.backings,
        }
      : m.geometry,
  };
}
