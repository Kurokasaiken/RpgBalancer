import React, { type CSSProperties, type ReactNode } from 'react';

export type HudRibbonAnchor = 'top' | 'bottom';

export interface HudRibbonProps {
  children: ReactNode;
  /**
   * Which screen edge the ribbon hangs from. `top` is full-width at its top
   * edge and cut in at the bottom corners (a valance hanging down); `bottom`
   * is the mirror (a plinth standing up).
   */
  anchor?: HudRibbonAnchor;
  /** Horizontal depth of the corner cut, in px. */
  cutPx?: number;
  /** Small gold lozenge centred on the free edge. */
  ornament?: boolean;
  /**
   * Extra inset bevel (highlight + carved shadow) on top of the flat fill —
   * the "Cartographer's Desk" material weight from the R-075 A/B: a ribbon
   * that reads as cut from something solid, not printed on a flat plane.
   */
  bevel?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * HudRibbon — a shaped banner, not a rounded rectangle.
 *
 * The single biggest thing the reference mockup does that the previous build
 * did not: every piece of chrome has a *silhouette*. Uniform-radius rounded
 * rectangles are the clearest "this is a web page" tell there is, and the
 * whole shell was made of them. A ribbon is cut at its corners, carries one
 * warm hairline on its anchored edge, and hangs — so it reads as a thing in
 * the world rather than a div.
 *
 * Material lives here as module constants, matching how the project's other
 * materials are authored (`BAR_ENERGY` in `CarvedBar`, `INSET_PANEL_PRESETS`
 * in `InsetPanel`, `MATERIAL_PRESETS` in `WanderlustSurface`): structure and
 * gameplay numbers are config-first, material recipes live with the material.
 *
 * Review R-075 (2026-09-22): the fill and hairline below used to carry their
 * own `rgba(9,30,36,...)` literals, duplicating the V9 Obsidian skin instead
 * of reading it. Every color reference here now resolves through `--skin-*`
 * custom properties so a different skin preset re-materials this ribbon for
 * free instead of leaving it stuck on V9's palette.
 */
const LACQUER = 'color-mix(in srgb, var(--skin-surface-base, #060f16) 62%, var(--hud-lacquer-tint, #0f4a52))';
const RIBBON_FILL = `linear-gradient(180deg, color-mix(in srgb, ${LACQUER} 80%, black) 0%, ${LACQUER} 100%)`;
const RIBBON_FILL_INVERTED = `linear-gradient(0deg, color-mix(in srgb, ${LACQUER} 80%, black) 0%, ${LACQUER} 100%)`;
/** Deep-teal contact + ambient shadow (bible §2: shadows are never grey or brown). */
const SHADOW = 'drop-shadow(0 3px 5px rgba(3,26,30,0.55)) drop-shadow(0 10px 22px rgba(3,26,30,0.3))';
/** Gold filigree line drawn this many px inside the ribbon's silhouette. */
const FILIGREE_INSET_PX = 4;

function ribbonPolygon(isTop: boolean, cutPx: number, d = 0): string {
  // A cut edge slopes, so a perpendicular inset of d shifts its end points by roughly d along x too.
  return isTop
    ? `polygon(${d}px ${d}px, calc(100% - ${d}px) ${d}px, calc(100% - ${cutPx + d}px) calc(100% - ${d}px), ${cutPx + d}px calc(100% - ${d}px))`
    : `polygon(${cutPx + d}px ${d}px, calc(100% - ${cutPx + d}px) ${d}px, calc(100% - ${d}px) calc(100% - ${d}px), ${d}px calc(100% - ${d}px))`;
}
const HAIRLINE =
  'linear-gradient(90deg, transparent 0%, var(--skin-surface-border, rgba(223,184,87,0.5)) 12%, var(--skin-title-color, #f0cf6a) 50%, var(--skin-surface-border, rgba(223,184,87,0.5)) 88%, transparent 100%)';

export const HudRibbon: React.FC<HudRibbonProps> = ({
  children,
  anchor = 'top',
  cutPx = 16,
  ornament = false,
  bevel = false,
  className,
  style,
}) => {
  const isTop = anchor === 'top';
  const clipPath = ribbonPolygon(isTop, cutPx);
  const fill = isTop ? RIBBON_FILL : RIBBON_FILL_INVERTED;
  const bevelShadow = bevel ? 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -3px 5px rgba(0,0,0,0.5)' : undefined;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        // Own stacking context for the z-index:-1 layers below; the root itself is NOT clipped.
        isolation: 'isolate',
        display: 'flex',
        alignItems: 'center',
        padding: isTop ? '7px 26px 9px' : '9px 26px 7px',
        ...style,
      }}
    >
      {/* clip-path and box-shadow/filter on one node cancel the shadow: it lives on an unclipped wrapper around the clipped silhouette. */}
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', filter: SHADOW }}>
        <span style={{ position: 'absolute', inset: 0, clipPath, background: fill, boxShadow: bevelShadow }} />
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: ribbonPolygon(isTop, cutPx, FILIGREE_INSET_PX),
          background: 'var(--skin-surface-border, rgba(223,184,87,0.55))',
          opacity: 0.7,
          pointerEvents: 'none',
          // clip-path makes this ribbon a stacking context, so -1 lands above its own fill but below its content.
          zIndex: -1,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: ribbonPolygon(isTop, cutPx, FILIGREE_INSET_PX + 1),
          background: fill,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          [isTop ? 'top' : 'bottom']: 0,
          height: 1,
          background: HAIRLINE,
        }}
      />
      {ornament && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            [isTop ? 'bottom' : 'top']: -1,
            width: 7,
            height: 7,
            transform: 'translateX(-50%) rotate(45deg)',
            background: 'var(--skin-title-color, #f0cf6a)',
            boxShadow: '0 0 7px rgba(240,207,106,0.55)',
          }}
        />
      )}
      {children}
    </div>
  );
};

export default HudRibbon;
