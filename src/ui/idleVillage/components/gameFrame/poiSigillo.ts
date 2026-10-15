/**
 * Size classes of the POI Sigillo (poi_family_spec §Size = threat magnitude).
 * The class is a factor on the marker's authored base size (`QuestPoi.sizePx`,
 * 55 px = M), so the px values match `--skin-poi-size-s/-m/-l` (44 / 55 / 69).
 */
export type PoiSizeClass = 'S' | 'M' | 'L';

export const POI_SIZE_FACTOR: Readonly<Record<PoiSizeClass, number>> = { S: 0.8, M: 1, L: 1.25 };

export function poiSizePx(basePx: number, sizeClass: PoiSizeClass): number {
  return Math.round(basePx * POI_SIZE_FACTOR[sizeClass]);
}
