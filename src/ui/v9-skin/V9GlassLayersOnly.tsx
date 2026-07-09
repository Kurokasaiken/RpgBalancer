/**
 * V9 Glass Layers Only — Layer divs only, no wrapper
 *
 * Renders ONLY the glass surface layer divs (not a container).
 * Use this inside existing containers that need the V9 aesthetic layered underneath content.
 * Includes SVG filter definition.
 */

import React from 'react';
import './v9GlassSurface.css';

export const V9GlassLayersOnly: React.FC = () => {
  return (
    <>
      {/* SVG filter: feColorMatrix to drain red channel */}
      <svg style={{ display: 'none' }} aria-hidden="true">
        <defs>
          <filter id="v9-reduce-red" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.60 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      {/* Layer 0: Glass painting */}
      <div className="v9-glass-surface__painting" aria-hidden="true" />

      {/* Layer 1: Glass tint */}
      <div className="v9-glass-surface__tint" aria-hidden="true" />

      {/* Layer 1.5: Glass prism */}
      <div className="v9-glass-surface__prism" aria-hidden="true" />

      {/* Layer 2: Cyan light */}
      <div className="v9-glass-surface__light-cyan" aria-hidden="true" />

      {/* Layer 3: Warm gold light */}
      <div className="v9-glass-surface__light-warm" aria-hidden="true" />

      {/* Layer 4: Grain texture */}
      <div className="v9-glass-surface__grain" aria-hidden="true" />
    </>
  );
};

export default V9GlassLayersOnly;
