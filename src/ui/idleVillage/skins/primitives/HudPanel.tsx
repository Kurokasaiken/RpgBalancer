import React, { type CSSProperties, type ReactNode } from 'react';

export interface HudPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Render as a different element (e.g. 'section', 'aside'). Default 'div'. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Depth of the corner chamfer, in px — the shared HUD silhouette. */
  cutPx?: number;
}

/**
 * Material shared with `HudRibbon` so the floating panels and the edge ribbons
 * read as one family: a lacquered slab carrying a gold filet on its silhouette
 * and one filigree hairline inside it. Every color resolves through `--skin-*`
 * custom properties, so a different skin preset re-materials the panel for free.
 */
const LACQUER = 'color-mix(in srgb, var(--skin-surface-base, #060f16) 62%, var(--hud-lacquer-tint, #0f4a52))';
const PANEL_FILL = `linear-gradient(180deg, ${LACQUER} 0%, color-mix(in srgb, ${LACQUER} 78%, black) 100%)`;
const FILET = 'var(--skin-surface-border, rgba(223,184,87,0.55))';
/** Deep-teal contact + ambient shadow (bible §2: shadows are never grey or brown). */
const SHADOW = 'drop-shadow(0 3px 5px rgba(3,26,30,0.55)) drop-shadow(0 10px 24px rgba(3,26,30,0.3))';
/** Gold filigree line drawn this many px inside the panel's silhouette. */
const FILIGREE_INSET_PX = 4;

/**
 * Chamfered-octagon outline: `cutPx` is the corner cut, `d` an inset used to
 * draw the filet/filigree as clipped layers 1px apart (clip-path eats CSS
 * borders, so the borders are painted as stacked silhouettes instead).
 */
function chamferedPolygon(cutPx: number, d = 0): string {
  const c = cutPx + d;
  return `polygon(${c}px ${d}px, calc(100% - ${c}px) ${d}px, calc(100% - ${d}px) ${c}px, calc(100% - ${d}px) calc(100% - ${c}px), calc(100% - ${c}px) calc(100% - ${d}px), ${c}px calc(100% - ${d}px), ${d}px calc(100% - ${c}px), ${d}px ${c}px)`;
}

const layer = (cutPx: number, d: number, background: string, opacity?: number): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  clipPath: chamferedPolygon(cutPx, d),
  background,
  opacity,
  pointerEvents: 'none',
  // clip-path makes the panel a stacking context, so -1 lands above its own
  // fill but below its content — same trick as HudRibbon's filigree.
  zIndex: -1,
});

/**
 * HudPanel — the HUD's floating-panel primitive.
 *
 * The panel counterpart of `HudRibbon`: chamfered corners (uniform-radius
 * rounded rectangles are the clearest "web page" tell there is), a gold filet
 * on the silhouette, a filigree hairline inside, and a drop shadow that follows
 * the clipped shape (a `filter` on an unclipped wrapper; `box-shadow` or a filter on
 * the clipped node itself would be cut away by the clip-path).
 * Use it for every floating HUD slab — event ledger, director panel, instrument
 * pods — so they share the ribbons' material instead of inventing flat cards.
 */
export const HudPanel: React.FC<HudPanelProps> = ({
  as: Tag = 'div',
  children,
  cutPx = 10,
  className,
  style,
  ...rest
}) => {
  const Component = Tag as React.ElementType;
  return (
    <Component
      className={className}
      style={{
        position: 'relative',
        // Own stacking context for the z-index:-1 layers below; the root itself is NOT clipped.
        isolation: 'isolate',
        ...style,
      }}
      {...rest}
    >
      {/* clip-path and filter on one node cancel the shadow: the shadow lives on an unclipped wrapper around the clipped silhouette. */}
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', filter: SHADOW }}>
        <span style={{ position: 'absolute', inset: 0, clipPath: chamferedPolygon(cutPx), background: FILET }} />
      </span>
      <span aria-hidden="true" style={layer(cutPx, 1, PANEL_FILL)} />
      <span aria-hidden="true" style={layer(cutPx, FILIGREE_INSET_PX, FILET, 0.6)} />
      <span aria-hidden="true" style={layer(cutPx, FILIGREE_INSET_PX + 1, PANEL_FILL)} />
      {children}
    </Component>
  );
};

export default HudPanel;
