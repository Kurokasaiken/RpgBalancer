/**
 * V9 Glass Layers — Shared Component
 *
 * Renders the complete V9 glass surface layer stack (painting + tint + prism + lights).
 * Drop this inside any container that needs the "Oily Prismatic Bronze & Wilderness Green" aesthetic.
 *
 * Single source of truth: changes to this component + v9GlassSurface.css apply everywhere.
 */

import React from 'react';
import './v9GlassSurface.css';

export interface V9GlassLayersProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Palette variant — defaults to 'base' (Layout Primitives aesthetic).
   * - 'base': Clean, minimal Layout Primitives template (default)
   * - 'sapphire': Zaffiro Abissale (maritime/exploration theme)
   * Maps to .v9-glass-surface--<variant> in v9GlassSurface.css
   */
  variant?: 'base' | 'sapphire';
  /** Content to render above the glass layers (z-index: 10) */
  children?: React.ReactNode;
}

export const V9GlassLayers: React.FC<V9GlassLayersProps> = ({
  className = '',
  variant = 'base',
  style = {},
  children,
  ...rest
}) => {
  return (
    <>
      {/* SVG filter: feColorMatrix to drain red channel (keeps teal/green intact) */}
      <svg style={{ display: 'none' }} aria-hidden="true">
        <defs>
          <filter id="v9-reduce-red" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.60 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      <div
        className={`v9-glass-surface v9-glass-surface--${variant} ${className}`}
        style={style}
        {...rest}
      >
        {/* Layer 0: Glass painting (bg.png rotated 180°, scaled, filtered) */}
        <div className="v9-glass-surface__painting" aria-hidden="true" />

        {/* Layer 1: Glass tint (radial vignette + green overlay) */}
        <div className="v9-glass-surface__tint" aria-hidden="true" />

        {/* Layer 1.5: Glass prism (oil-slick iridescence, animated) */}
        <div className="v9-glass-surface__prism" aria-hidden="true" />

        {/* Layer 2: Cyan light (top-left, screen blend) */}
        <div className="v9-glass-surface__light-cyan" aria-hidden="true" />

        {/* Layer 3: Warm gold light (bottom-right, screen blend) */}
        <div className="v9-glass-surface__light-warm" aria-hidden="true" />

        {/* Layer 4: Grain texture (subtle noise overlay) */}
        <div className="v9-glass-surface__grain" aria-hidden="true" />

        {/* Content slot: sits above all glass layers */}
        <div className="v9-glass-surface__content">
          {children}
        </div>
      </div>
    </>
  );
};

export default V9GlassLayers;
