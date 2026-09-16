import React from 'react';
import { settlementLostConfig } from '@/balancing/config/idleVillage/settlementLostConfig';

/**
 * Mounts the SVG `<filter>` that remaps painted art onto the oxidised
 * (verdigris) ramp for the Settlement Lost takeover.
 *
 * Same gradient-map recipe as the event shroud grade in
 * `WorldSurfaceRenderer`: desaturate to luminance, then re-map each channel
 * through a table transfer. Mount once per page before any element references
 * `filter: url(#<filterId>)` — a CSS filter pointing at a missing id makes the
 * element disappear entirely, it does not degrade to "no filter".
 */
export const OxidizedGradeFilter: React.FC = () => {
  const { ramp, filterId } = settlementLostConfig;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <filter id={filterId} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={ramp.red.join(' ')} />
          <feFuncG type="table" tableValues={ramp.green.join(' ')} />
          <feFuncB type="table" tableValues={ramp.blue.join(' ')} />
        </feComponentTransfer>
      </filter>
    </svg>
  );
};

export default OxidizedGradeFilter;
