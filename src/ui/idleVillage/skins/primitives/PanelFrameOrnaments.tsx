import React, { type CSSProperties } from 'react';
import type {
  SliceKitBacking,
  SliceKitFrameManifest,
  SliceKitManifestPiece,
  SliceKitPiecePos,
} from './sliceKitManifest';

/** R-353: the mockup-stash-grid ornate frame — corner pieces cut straight out
 *  of the signed reference (HSV extraction: brass + emerald enamel + dark
 *  field kept, map/UI dropped). The stash set carries its own asymmetric
 *  corners (treasure-chest emblem top-left); the roster set reuses the plain
 *  acanthus pieces — the mockup's roster corners are generic scrollwork, and
 *  a chest emblem would be semantically wrong there. */
const DIR = '/assets/ui/hud-real/panel-frame';
const SRC = {
  stash: {
    tl: `${DIR}/corner-mockup-tl.webp`,
    tr: `${DIR}/corner-mockup-tr.webp`,
    bl: `${DIR}/corner-mockup-bl.webp`,
    br: `${DIR}/corner-mockup-br.webp`,
  },
  roster: {
    tl: `${DIR}/corner-mockup-tr.webp`,
    tr: `${DIR}/corner-mockup-tr.webp`,
    bl: `${DIR}/corner-mockup-bl.webp`,
    br: `${DIR}/corner-mockup-br.webp`,
  },
} as const;
/** Native pixel size of each source (w×h) — the pieces render ~1:1 with the
 *  mockup's own proportions. */
const SIZE = {
  stash: { tl: [59, 70], tr: [58, 56], bl: [55, 44], br: [36, 54] },
  roster: { tl: [58, 56], tr: [58, 56], bl: [55, 44], br: [36, 54] },
} as const;

export type PanelFrameVariant = keyof typeof SRC;

/** Variant tag a manifest-mode frame renders for: the slicer tags pieces
 *  (`variants`) against these ids — e.g. a chest emblem mounts only on the
 *  stash's `corniciStash`. The legacy variant sets keep their own names. */
export type PanelFrameManifestVariant = 'cornici' | 'corniciStash';

export interface PanelFrameOrnamentsProps {
  /** Which frame set to paint. Legacy names pick the R-353 corner set; when a
   *  `manifest` is supplied the value is the manifest variant tag instead. */
  variant?: PanelFrameVariant | PanelFrameManifestVariant;
  /** Uniform scale over the native piece size (default 1.35). */
  scale?: number;
  /** How far the ornaments ride out over the plaque edge in px (default 10). */
  outset?: number;
  /** Inset of the inner hairline filet in px (default 7). */
  filetInset?: number;
  /** PLAN-127 slice-kit frame (generated `<surface>Frame` manifest): when set,
   *  the component renders the manifest's own corners/edges/backings instead
   *  of the legacy variant set — every offset, size and span comes from the
   *  emitted geometry, nothing is hand-tuned here. */
  manifest?: SliceKitFrameManifest;
}

const Corner: React.FC<{ src: string; w: number; h: number; pos: React.CSSProperties; flip?: boolean }> = ({ src, w, h, pos, flip }) => (
  <img src={src} alt="" draggable={false} style={{ position: 'absolute', width: w, height: h, display: 'block', transform: flip ? 'scaleX(-1)' : undefined, ...pos }} />
);

/* ── Manifest mode (PLAN-127 slice-kit) ─────────────────────────────────── */

/** Manifest `pos` offsets → CSSProperties (numbers already mean px in CSS;
 *  strings like `"16%"` pass through for edge-anchored ornaments). */
const posStyle = (pos?: SliceKitPiecePos): CSSProperties => {
  const s: CSSProperties = {};
  if (pos?.left !== undefined) s.left = pos.left;
  if (pos?.right !== undefined) s.right = pos.right;
  if (pos?.top !== undefined) s.top = pos.top;
  if (pos?.bottom !== undefined) s.bottom = pos.bottom;
  return s;
};

/** The box corner a backing patch is anchored to → the INNER corner of the
 *  patch (where the plaque's rounded arc centres) for the crescent wedge. */
const BACKING_INNER: Record<SliceKitBacking['anchor'], string> = {
  tl: 'right bottom',
  tr: 'left bottom',
  bl: 'right top',
  br: 'left top',
};
const BACKING_POS: Record<SliceKitBacking['anchor'], CSSProperties> = {
  tl: { left: 0, top: 0 },
  tr: { right: 0, top: 0 },
  bl: { left: 0, bottom: 0 },
  br: { right: 0, bottom: 0 },
};

/** Corner-bite DOM backfill: covers the crescent of backdrop between the
 *  bands' inner rims and the plaque's rounded corner arc. Pure manifest data
 *  — the patch paints the wedge between the square box corner and a quarter
 *  circle of radius `min(w,h)` centred on the box's inner corner. */
const FrameBacking: React.FC<{ backing: SliceKitBacking }> = ({ backing }) => {
  const r = Math.min(backing.w, backing.h);
  const style: CSSProperties = {
    position: 'absolute',
    width: backing.w,
    height: backing.h,
    ...BACKING_POS[backing.anchor],
  };
  if (backing.shape === 'crescent') {
    style.background = `radial-gradient(circle ${r}px at ${BACKING_INNER[backing.anchor]}, transparent ${r - 0.75}px, ${backing.color} ${r}px)`;
  } else {
    style.background = backing.color;
    if (backing.radius) style.borderRadius = backing.radius;
  }
  return <div aria-hidden style={style} />;
};

/**
 * One emitted frame piece. Edges tile along their axis (`background-repeat`
 * on the display tile size) and sit so their content-facing rim overlaps the
 * panel edge by `rim` px; corners/ornaments render at their authored `pos`.
 */
const FramePiece: React.FC<{ piece: SliceKitManifestPiece; assetBase: string; rim: number }> = ({ piece, assetBase, rim }) => {
  const [w, h] = piece.displaySize ?? piece.nativeSize;
  const src = `${assetBase}${piece.file}`;
  if (piece.role === 'edge-x') {
    const [before = 0, after = 0] = piece.span ?? [];
    return (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -before,
          right: -after,
          height: h,
          ...(piece.anchor === 'top' ? { top: -(h - rim) } : { bottom: -(h - rim) }),
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: `${w}px ${h}px`,
        }}
      />
    );
  }
  if (piece.role === 'edge-y') {
    const [before = 0, after = 0] = piece.span ?? [];
    return (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -before,
          bottom: -after,
          width: w,
          ...(piece.anchor === 'left' ? { left: -(w - rim) } : { right: -(w - rim) }),
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'repeat-y',
          backgroundSize: `${w}px ${h}px`,
        }}
      />
    );
  }
  return <img src={src} alt="" draggable={false} style={{ position: 'absolute', width: w, height: h, display: 'block', ...posStyle(piece.pos) }} />;
};

/** Paint order inside the frame layer: backfills under everything, tiled
 *  edges next (their `span` ends tuck UNDER the corner art), then corners
 *  and free ornaments on top. */
const PIECE_ORDER: Record<SliceKitManifestPiece['role'], number> = { 'edge-x': 0, 'edge-y': 0, corner: 1, ornament: 2 };

const ManifestFrame: React.FC<{ manifest: SliceKitFrameManifest; variant: string }> = ({ manifest, variant }) => {
  const rim = manifest.geometry?.rimOverlapPx ?? 0;
  const pieces = manifest.pieces
    .filter((p) => !p.variants || p.variants.includes(variant))
    .slice()
    .sort((a, b) => PIECE_ORDER[a.role] - PIECE_ORDER[b.role]);
  return (
    <div
      data-panel-frame="ornate"
      data-frame-manifest={manifest.surface}
      data-frame-variant={variant}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}
    >
      {(manifest.geometry?.backings ?? []).map((b) => (
        <FrameBacking key={`backing-${b.anchor}`} backing={b} />
      ))}
      {pieces.map((p) => (
        <FramePiece key={p.id} piece={p} assetBase={manifest.assetBase} rim={rim} />
      ))}
    </div>
  );
};

/**
 * PanelFrameOrnaments — the ornate frame for the floating HUD panels
 * (roster, stash). Two modes:
 * - `manifest` set → the PLAN-127 slice-kit frame: every corner/edge/backing
 *   piece renders from the generated manifest geometry (`?frame=` swaps the
 *   manifest, nothing else changes here).
 * - legacy → the R-353 mockup-stash-grid corner set + inner hairline filet.
 *
 * Pure decoration: absolutely positioned, aria-hidden, pointer-events none —
 * mount it inside (or as a sibling of) the element that owns the plaque. It
 * never measures, never clips, and touches no contract surface.
 */
const SCALE_BY_VARIANT: Record<PanelFrameVariant, number> = { stash: 1.0, roster: 1.0 };

export const PanelFrameOrnaments: React.FC<PanelFrameOrnamentsProps> = ({ variant = 'stash', scale, outset = 12, filetInset = 7, manifest }) => {
  if (manifest) {
    return <ManifestFrame manifest={manifest} variant={variant} />;
  }
  const legacyVariant = (variant === 'cornici' || variant === 'corniciStash' ? 'stash' : variant) as PanelFrameVariant;
  const sc = scale ?? SCALE_BY_VARIANT[legacyVariant];
  const s = SRC[legacyVariant];
  const z = SIZE[legacyVariant];
  const o = -outset;
  const dim = (k: keyof typeof z) => ({ w: Math.round(z[k][0] * sc), h: Math.round(z[k][1] * sc) });
  return (
    <div data-panel-frame="ornate" data-frame-variant={legacyVariant} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
      <Corner src={s.tl} {...dim('tl')} pos={{ left: o, top: o }} flip={legacyVariant === 'roster'} />
      <Corner src={s.tr} {...dim('tr')} pos={{ right: o, top: o }} />
      <Corner src={s.bl} {...dim('bl')} pos={{ left: o, bottom: o }} />
      <Corner src={s.br} {...dim('br')} pos={{ right: o, bottom: o }} />
      <div
        style={{
          position: 'absolute',
          inset: filetInset,
          border: '1px solid var(--skin-hud-brass-hi)',
          borderRadius: 12,
          opacity: 0.45,
        }}
      />
    </div>
  );
};

export default PanelFrameOrnaments;
