import React from 'react';
import type { VillageBuildingCatalogId } from '@/balancing/config/idleVillage/villageBuildingsConfig';
import { HudGlyph } from './hudIcons';
import type { VillageBuildingDefinition } from '@/balancing/config/idleVillage/villageBuildingsConfig';

/**
 * Village building glyph set (PLAN-035, artifact r005).
 *
 * Eleven dedicated engraved silhouettes on the same contract as
 * `engravedIcons.tsx` (bible §11.6): 24×24 grid, `fill="currentColor"`, no
 * strokes, holes are `evenodd` cut-outs. They are NOT registered in
 * `engravedIcons.tsx`/`HudIconId` because they name buildings, not commands or
 * navigation — the config's `iconKey` keys this table 1:1, so a typo fails the
 * type check, never renders a wrong glyph.
 */

const EO = { fillRule: 'evenodd', clipRule: 'evenodd' } as const;

const GLYPHS: Record<VillageBuildingCatalogId, React.ReactNode> = {
  /* Lumbermill — a pile of felled logs seen end-on: ringed end-grain circles
   * in a 2+1 stack. */
  lumbermill: (
    <>
      <path {...EO} d="M7.2 19.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zM7.2 17.2a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z" />
      <path {...EO} d="M16.8 19.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zM16.8 17.2a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z" />
      <path {...EO} d="M12 10.8a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zM12 8.8a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z" />
    </>
  ),
  /* Quarry — a pick head resting over a rock seam: curved chisel bar, handle
   * into the stone wedge below. */
  quarry: (
    <>
      <path d="M2.6 9.4C5.4 5.2 8.6 3.6 12 3.6s6.6 1.6 9.4 5.8l-2.4 1.2c-1.8-2.6-4.2-4-6.8-4s-5 1.4-6.8 4z" />
      <rect x="10.9" y="6.2" width="2.2" height="9.8" rx="1" />
      <path d="M4 21.2l3.4-4.4L12 15l4.6 1.8 3.4 4.4z" />
    </>
  ),
  /* Farm — a pitchfork: three tines joined by a crossbar over the handle. */
  farm: (
    <>
      <rect x="11" y="10.2" width="2" height="11" rx="0.9" />
      <rect x="5" y="2.4" width="2" height="9" />
      <rect x="11" y="2.4" width="2" height="7" />
      <rect x="17" y="2.4" width="2" height="9" />
      <rect x="5" y="8.2" width="14" height="2.4" rx="0.6" />
    </>
  ),
  /* Warehouse — a shipping crate: solid box with a diagonal-brace X cut out. */
  warehouse: (
    <path
      {...EO}
      d="M3.6 5.4h16.8v13.6H3.6zM8.4 7.8 12 11.4l3.6-3.6 1.5 1.5-3.6 3.6 3.6 3.6-1.5 1.5-3.6-3.6-3.6 3.6-1.5-1.5 3.6-3.6-3.6-3.6z"
    />
  ),
  /* Inn — a foaming tankard: body with a foam slit, foam crown, D handle. */
  inn: (
    <>
      <circle cx="8.2" cy="3.8" r="1.7" />
      <circle cx="11.4" cy="3.4" r="1.9" />
      <circle cx="14.4" cy="3.8" r="1.7" />
      <path {...EO} d="M5.4 5h10.4v15.4H5.4zM7.6 7.8h6.2v1.8H7.6z" />
      <path {...EO} d="M15.8 7.6h2.8a3.8 3.8 0 0 1 0 7.6h-2.8v-2.2h2.4a1.6 1.6 0 0 0 0-3.2h-2.4z" />
    </>
  ),
  /* Smithy — an anvil: top bar with the horn tapering left, waist, wide base. */
  smithy: (
    <>
      <path d="M3.4 5h17.2v3.4h-5.2l-.4 4.6h2.4v3.4H6.6v-3.4H9l-.4-4.6H3.4z" />
      <path d="M3.4 5 1.2 7.4l2.2 1.4z" />
    </>
  ),
  /* Market — a stall: striped canopy cut-outs over the counter and apron. */
  market: (
    <>
      <path {...EO} d="M12 2.4 2.2 8.6v2.4h19.6V8.6zM8.6 8.6l1.8-3.8h1.6l-1.8 3.8zM13.8 8.6l1.8-3.8h1.6l-1.8 3.8z" />
      <rect x="3.8" y="11" width="1.6" height="5.6" />
      <rect x="18.6" y="11" width="1.6" height="5.6" />
      <rect x="3.2" y="15.4" width="17.6" height="2.4" rx="0.6" />
      <rect x="5.4" y="17.8" width="13.2" height="3.4" />
    </>
  ),
  /* Infirmary — a healer's house: cottage silhouette with a cross cut-out. */
  infirmary: (
    <path
      {...EO}
      d="M12 2.8 3.2 9.6h2.2v10h13.2v-10h2.2zM10.4 9.8h3.2v2.4h2.6v3h-2.6v2.4h-3.2v-2.4H7.8v-3h2.6z"
    />
  ),
  /* Palisade — a row of sharpened stakes bound by a rail. */
  palisade: (
    <path d="M3.4 8.8 4.5 5.2l1.1 3.6v11.8H3.4zM7.2 8.8l1.1-3.6 1.1 3.6v11.8H7.2zM11 8.8l1.1-3.6 1.1 3.6v11.8H11zM14.8 8.8l1.1-3.6 1.1 3.6v11.8h-2.2zM18.6 8.8l1.1-3.6 1.1 3.6v11.8h-2.2zM2.6 12.4h18.8v2H2.6z" />
  ),
  /* Watchtower — a tapering lookout tower: cross-braced shaft, roofed crown. */
  watchtower: (
    <>
      <path {...EO} d="M8.6 10.2h6.8l1.4 11.4H7.2zM9.8 12.2l2.2 3-2.2 3h-1l2-3-2-3zM14.2 12.2l-2.2 3 2.2 3h1l-2-3 2-3z" />
      <path d="M6.6 10.2h10.8V6.4L12 2.2 6.6 6.4z" />
    </>
  ),
  /* Barracks — a militia shield with a sword cut-out (blade, guard, pommel). */
  barracks: (
    <path
      {...EO}
      d="M12 2.2l8.2 2.9v6.4c0 5-3.5 8.6-8.2 10.5-4.7-1.9-8.2-5.5-8.2-10.5V5.1zM11 5.6h2v7h-2zM8.4 12.8h7.2v1.8H8.4zM12 16.8a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"
    />
  ),
};

export interface VillageBuildingIconProps {
  /** Config `iconKey` — the building id itself, so the table can never drift. */
  iconKey: VillageBuildingCatalogId;
  size?: number;
}

/**
 * One building glyph — tinted by `currentColor` like every HUD icon. The pin's
 * button carries the accessible name, so the glyph renders `aria-hidden`.
 */
export const VillageBuildingIcon: React.FC<VillageBuildingIconProps> = ({ iconKey, size = 20 }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ flexShrink: 0, display: 'block' }}
  >
    {GLYPHS[iconKey]}
  </svg>
);

/** Resource ids a building tier cost may carry — mirrors `buildingTierSchema.cost`. */
export type VillageCostResource = keyof VillageBuildingDefinition['tiers'][number]['cost'];

const INGOT = (
  <>
    <path d="M8.4 10.4h7.2l1.6 3.6H6.8z" />
    <path d="M3.6 15.6h7.2l1.6 3.6H5.2z" />
    <path d="M13.2 15.6h7.2l1.6 3.6h-7.2z" />
    <path d="M8.4 5.4h7.2l1.6 3.4H6.8z" />
  </>
);

/**
 * Cost-line icon for one canonical resource: painted objects (gold, food,
 * wood) render `HudGlyph`, iron renders the engraved ingot stack — the
 * resource has no painted asset yet.
 */
export const VillageCostIcon: React.FC<{ resource: VillageCostResource; label: string; size?: number }> = ({ resource, label, size = 16 }) => {
  if (resource === 'iron') {
    return (
      <svg
        role="img"
        aria-label={label}
        focusable="false"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ flexShrink: 0, display: 'block' }}
      >
        {INGOT}
      </svg>
    );
  }
  return <HudGlyph iconId={resource} label={label} size={size} />;
};

export default VillageBuildingIcon;
