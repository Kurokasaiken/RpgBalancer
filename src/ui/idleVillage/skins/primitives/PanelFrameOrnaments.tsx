import React from 'react';

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

export interface PanelFrameOrnamentsProps {
  /** Which mockup corner set to paint (default 'stash'). */
  variant?: PanelFrameVariant;
  /** Uniform scale over the native piece size (default 1.35). */
  scale?: number;
  /** How far the ornaments ride out over the plaque edge in px (default 10). */
  outset?: number;
  /** Inset of the inner hairline filet in px (default 7). */
  filetInset?: number;
}

const Corner: React.FC<{ src: string; w: number; h: number; pos: React.CSSProperties; flip?: boolean }> = ({ src, w, h, pos, flip }) => (
  <img src={src} alt="" draggable={false} style={{ position: 'absolute', width: w, height: h, display: 'block', transform: flip ? 'scaleX(-1)' : undefined, ...pos }} />
);

/**
 * PanelFrameOrnaments — the mockup-stash-grid ornate frame for the floating
 * HUD panels (roster, stash): the mockup's own brass+acanthus corner pieces
 * laid over the HudPlaque edge, plus the inner hairline that gives the
 * mockup's double-frame read.
 *
 * Pure decoration: absolutely positioned, aria-hidden, pointer-events none —
 * mount it inside (or as a sibling of) the element that owns the plaque. It
 * never measures, never clips, and touches no contract surface.
 */
const SCALE_BY_VARIANT: Record<PanelFrameVariant, number> = { stash: 1.0, roster: 1.0 };

export const PanelFrameOrnaments: React.FC<PanelFrameOrnamentsProps> = ({ variant = 'stash', scale, outset = 12, filetInset = 7 }) => {
  const sc = scale ?? SCALE_BY_VARIANT[variant];
  const s = SRC[variant];
  const z = SIZE[variant];
  const o = -outset;
  const dim = (k: keyof typeof z) => ({ w: Math.round(z[k][0] * sc), h: Math.round(z[k][1] * sc) });
  return (
    <div data-panel-frame="ornate" data-frame-variant={variant} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
      <Corner src={s.tl} {...dim('tl')} pos={{ left: o, top: o }} flip={variant === 'roster'} />
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
