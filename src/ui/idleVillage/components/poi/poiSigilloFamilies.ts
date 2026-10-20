import type { PoiType } from './PoiMarker';

/** Sigillo metal per family (Director 2026-10-20: quest bronze, work ivory, activity steel (teal: tried, replaced by ivory for work)).
 *  Rim = [light, mid, dark]; `borderInner` is the thin inner line and replaces the white one. Field stays the shared lacquer. */
export interface PoiFamilyMetal {
  rimColors: readonly [string, string, string];
  borderInner: string;
  /** Field gradient [light, deep]: warm mid-tone parchment (a step darker than pure parchment) so both the dark and the pale painted glyphs read (Director 2026-10-20). */
  stoneColors: readonly [string, string];
}

const PARCHMENT_FIELD = ['#d3be91', '#b09866'] as const; // old parchment, sand/beige (Director 2026-10-20)

export const POI_METAL_BRONZE: PoiFamilyMetal = { rimColors: ['#e2c77e', '#b38a3c', '#6e4c1c'], borderInner: '#d8bd78', stoneColors: PARCHMENT_FIELD };
export const POI_METAL_TEAL: PoiFamilyMetal = { rimColors: ['#7fd0c4', '#2f8f8a', '#17504f'], borderInner: '#7fd0c4', stoneColors: PARCHMENT_FIELD };
export const POI_METAL_STEEL: PoiFamilyMetal = { rimColors: ['#b7c6d6', '#6c8299', '#334657'], borderInner: '#b7c6d6', stoneColors: PARCHMENT_FIELD };
export const POI_METAL_IVORY: PoiFamilyMetal = { rimColors: ['#f1e8d0', '#c9bb98', '#8a7d5e'], borderInner: '#c9bb98', stoneColors: PARCHMENT_FIELD };

/** quest = bronze, job = ivory, event/activity = steel. */
export const POI_FAMILY_METAL: Record<PoiType, PoiFamilyMetal> = {
  quest: POI_METAL_BRONZE,
  job: POI_METAL_IVORY,
  event: POI_METAL_STEEL,
};
