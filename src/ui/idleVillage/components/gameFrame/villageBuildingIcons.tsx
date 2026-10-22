import React from 'react';
import type { VillageBuildingCatalogId, VillageBuildingCategory, VillageBuildingState } from '@/balancing/config/idleVillage/villageBuildingsConfig';
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
  /* ——— Registry-only buildings (PLAN-042) — same 24×24 engraved contract. ——— */
  /* Mage tower — a tapering spire with an arched doorway and a spark crown. */
  mageTower: (
    <>
      <path {...EO} d="M12 2l3.8 5H8.2zM8.8 6.4h6.4l1.4 15.2H7.4zM10.4 21.6v-3.4a1.6 1.6 0 0 1 3.2 0v3.4z" />
      <circle cx="12" cy="1.4" r="0.9" />
      <circle cx="5.6" cy="5.2" r="0.7" />
      <circle cx="18.4" cy="5.2" r="0.7" />
    </>
  ),
  /* Adventurers' guild — crossed swords under a small pennant. */
  adventurersGuild: (
    <>
      <path {...EO} d="M5.6 2.6l9.8 12.6 1.6-1.6L7.2 1zm12.8 0L8.6 13.6l1.6 1.6L20 2.6z" />
      <path d="M7 16.4l3.4 1.4-1.4 3.4-3.4-1.4zM17 16.4l-3.4 1.4 1.4 3.4 3.4-1.4z" />
    </>
  ),
  /* Sanctuary — a sun disc rising over a three-arch altar arcade. */
  sanctuary: (
    <>
      <circle cx="12" cy="7.4" r="3.6" />
      <path {...EO} d="M3.6 12.6h16.8v8.8H3.6zM5.4 21.4v-5a1.8 1.8 0 0 1 3.6 0v5zM10.2 21.4v-5a1.8 1.8 0 0 1 3.6 0v5zM15 21.4v-5a1.8 1.8 0 0 1 3.6 0v5z" />
    </>
  ),
  /* Alchemist — a round-bottom alembic with a neck tube and a drop. */
  alchemist: (
    <>
      <path d="M10.4 2.6h3.2v4.4l2 1.8a6.6 6.6 0 1 1-7.2 0l2-1.8z" />
      <path {...EO} d="M12 9.6a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11.4a3.2 3.2 0 0 0-2.6 5h5.2a3.2 3.2 0 0 0-2.6-5z" />
      <path d="M17.8 3.4c1 1.4 1.6 2.4 1.6 3.2a1.6 1.6 0 1 1-3.2 0c0-.8.6-1.8 1.6-3.2z" />
    </>
  ),
  /* Cemetery — a rounded headstone planted in a small mound. */
  cemetery: (
    <>
      <path {...EO} d="M12 3.2a4.6 4.6 0 0 1 4.6 4.6v9.8H7.4V7.8A4.6 4.6 0 0 1 12 3.2zM10.4 7.4h3.2v2h-3.2z" />
      <path d="M3 20.4c1.6-1.8 4-2.4 9-2.4s7.4.6 9 2.4z" />
    </>
  ),
};

/**
 * Category → frame silhouette map (PLAN-038, debate artifact r003): the frame
 * is the redundant channel for `category` so the icon only names the building.
 * Roundel = production, banner = civic, shield = defense, spire = arcane
 * (PLAN-042 — registry/legend only; no arcane building is painted yet).
 */
export type VillagePinFrameShape = 'roundel' | 'banner' | 'shield' | 'spire';

/** Category → frame silhouette. Exported for tests and the visual legend. */
export const PIN_FRAME_FOR_CATEGORY: Record<VillageBuildingCategory, VillagePinFrameShape> = {
  production: 'roundel',
  civic: 'banner',
  defense: 'shield',
  arcane: 'spire',
};

/** 48-viewBox silhouette paths for the pin frame (aspect-differentiated). */
const FRAME_PATHS: Record<VillagePinFrameShape, string> = {
  /* Roundel — plain circle ring (production is the "worker" roundel). */
  roundel: 'M24 2a22 22 0 1 0 0 44 22 22 0 0 0 0-44z',
  /* Banner — horizontal civic plaque with V-notched ribbon tails both ends. */
  banner: 'M9 11h30v24l-6-12 6-12H9zM9 11l-7 12 7 12zM39 11l7 12-7 12z',
  /* Shield — flat-top heater, taller than wide (defense reads "crest"). */
  shield: 'M8 3h32v16c0 13-8.5 21-16 24-7.5-3-16-11-16-24z',
  /* Spire — pointed arcane obelisk: tall tapering shaft with a star-tipped
   *  needle crown (arcane reads "reaching upward"). */
  spire: 'M24 2l7 10h-4l6 8-3 24H18l-3-24 6-8h-4z',
};

export interface VillagePinFrameProps {
  /** Category-derived silhouette. */
  frame: VillagePinFrameShape;
  /** State treatment: built = solid ring, buildable = dashed survey ring,
   *  locked = desaturated + dimmed (badge itself stays full contrast). */
  state: VillageBuildingState;
  /** Render size in CSS px — the pin is ~40px, so default 44 leaves margin. */
  size?: number;
}

/**
 * The decorative frame behind a village pin glyph. `aria-hidden` — the pin
 * button carries category in its `aria-label`; the frame is redundant visual
 * encoding only. Dashed stroke = "survey ring" (buildable); solid = built;
 * desaturated fill = locked. The contrast is guaranteed by the lacquer fill
 * behind, so the frame itself never has to solve the contrast roulette.
 */
export const VillagePinFrame: React.FC<VillagePinFrameProps> = ({ frame, state, size = 44 }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 48 48"
    /* width/height in STYLE, not just attrs: `skinScope.css` forces
     * `button svg { width: var(--skin-hud-control-icon-size) }` (14px) on
     * every svg inside a HUD button — inline style wins that cascade. */
    style={{ position: 'absolute', left: '50%', top: '50%', translate: '-50% -50%', width: size, height: size, display: 'block', filter: state === 'locked' ? 'saturate(0.35)' : undefined }}
  >
    <path
      d={FRAME_PATHS[frame]}
      fill="var(--skin-hud-lacquer-base)"
      fillOpacity={state === 'locked' ? 0.8 : 1}
      stroke={state === 'buildable' ? 'var(--skin-hud-brass-crest)' : 'var(--skin-hud-brass-hi)'}
      strokeWidth={frame === 'shield' ? 3 : 2.5}
      strokeDasharray={state === 'buildable' ? '5 4' : undefined}
      strokeLinejoin="round"
    />
  </svg>
);

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
    style={{ flexShrink: 0, display: 'block', width: size, height: size }}
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
