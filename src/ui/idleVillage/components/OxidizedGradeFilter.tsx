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
 *
 * `progress` (0..1, default 1) blends from "no grade" to the full ramp: the
 * saturation and every table entry are interpolated, so the world can be graded
 * over the iris sweep instead of snapping. A CSS `transition` cannot do this —
 * it does not animate through `url(#…)` filters.
 */
export interface OxidizedGradeFilterProps {
  progress?: number;
  /** Override the DOM id when a second instance must coexist with the overlay's own. */
  filterId?: string;
}

const lerpTable = (ramp: readonly number[], p: number): string =>
  ramp
    .map((v, i) => {
      const identity = i / (ramp.length - 1);
      return (identity + (v - identity) * p).toFixed(4);
    })
    .join(' ');

export const OxidizedGradeFilter: React.FC<OxidizedGradeFilterProps> = ({
  progress = 1,
  filterId: filterIdOverride,
}) => {
  const { ramp, filterId } = settlementLostConfig;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <filter id={filterIdOverride ?? filterId} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values={String(1 - p)} />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={lerpTable(ramp.red, p)} />
          <feFuncG type="table" tableValues={lerpTable(ramp.green, p)} />
          <feFuncB type="table" tableValues={lerpTable(ramp.blue, p)} />
        </feComponentTransfer>
      </filter>
    </svg>
  );
};

export default OxidizedGradeFilter;
