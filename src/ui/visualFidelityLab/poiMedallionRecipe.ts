/**
 * POI Medallion — palette-per-type recipe (2026-07-19).
 *
 * The 4 palettes the user approved in poi-skin-preview.html, expressed as data
 * (the clean seam: GenericPoiSkin is already palette-driven via props, so type →
 * palette is a lookup, not a component change). Kept in the LAB while the new
 * corona halo is proven; promote to the real skins config (questPoiSkinConfig /
 * poiAmberSkinConfig family) once validated on /minimal-poi.
 *
 * PHASE DECISION (user Q4): props/palette-config-driven for now — NOT the full
 * config-first JSON skin-definition + componentSlots system from the HTML. That
 * JSON is the Design-System-phase (7) industrialization target, premature here.
 *
 * TYPE MAPPING: POIs already carry a type via `cardKind` ('job' | 'quest' | …)
 * in the activity config (balancing/config/idleVillage/defaultConfig.ts). The
 * TYPE_SKIN map below is a PROPOSAL — the amber/ember/lapis/verdigris → quest/
 * event/activity/job assignment is a product call, trivially editable here.
 */

export interface PoiPalette {
  /** corona arc core color (the filling energy). */
  coronaCore: { r: number; g: number; b: number };
  /** corona outer bloom/glow color. */
  coronaGlow: { r: number; g: number; b: number };
  /** rim 3-stop bronze/metal ladder [lit, body, dark]. */
  rimColors: [string, string, string];
  /** stone body radial [center, edge]. */
  stoneColors: [string, string];
  /** warm ambient wash inside the stone. */
  stoneAmbient: string;
  /** engraved pin/icon color. */
  pinColor: string;
}

/** Named skins — the 4 approved variants (poi-skin-preview.html SKINS[]). */
export const POI_SKINS = {
  amber: {
    coronaCore: { r: 210, g: 138, b: 28 },
    coronaGlow: { r: 180, g: 105, b: 10 },
    rimColors: ['#fce890', '#c09030', '#200e02'],
    stoneColors: ['#1e1608', '#030202'],
    stoneAmbient: 'rgba(255,220,120,.22)',
    pinColor: 'rgba(205,190,148,.72)',
  },
  lapis: {
    coronaCore: { r: 42, g: 82, b: 190 },
    coronaGlow: { r: 25, g: 55, b: 160 },
    rimColors: ['#c0d8fc', '#3060b0', '#020510'],
    stoneColors: ['#060c1e', '#010208'],
    stoneAmbient: 'rgba(120,160,255,.20)',
    pinColor: 'rgba(148,170,210,.72)',
  },
  ember: {
    coronaCore: { r: 220, g: 60, b: 18 },
    coronaGlow: { r: 180, g: 30, b: 5 },
    rimColors: ['#fca878', '#a03010', '#1a0202'],
    stoneColors: ['#1a0808', '#030101'],
    stoneAmbient: 'rgba(255,120,60,.20)',
    pinColor: 'rgba(210,160,130,.72)',
  },
  verdigris: {
    coronaCore: { r: 60, g: 180, b: 80 },
    coronaGlow: { r: 30, g: 130, b: 50 },
    rimColors: ['#a0f0c0', '#208050', '#020e04'],
    stoneColors: ['#081208', '#010402'],
    stoneAmbient: 'rgba(80,220,120,.18)',
    pinColor: 'rgba(140,210,160,.72)',
  },
} as const satisfies Record<string, PoiPalette>;

export type PoiSkinId = keyof typeof POI_SKINS;

/** POI type as it exists today in the activity config (`cardKind`). */
export type PoiType = 'quest' | 'job' | 'event' | 'activity';

/**
 * PROPOSED type → skin mapping. The user considers this LOW-PRIORITY for the
 * current phase, so this is a placeholder, not a committed taxonomy — the 4
 * palettes are just colour options for now. ("arcano" is NOT a valid POI type;
 * lapis is a colour skin, not a semantic category.)
 */
export const POI_TYPE_SKIN: Record<PoiType, PoiSkinId> = {
  quest: 'amber',
  event: 'ember',
  activity: 'lapis',
  job: 'verdigris',
};

/** Resolve a POI type to its palette, defaulting to amber for unknown types. */
export function getPoiPalette(type?: string): PoiPalette {
  const skinId = (type && POI_TYPE_SKIN[type as PoiType]) || 'amber';
  return POI_SKINS[skinId];
}
