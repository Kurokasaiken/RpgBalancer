import { z } from 'zod';
import type { PaintedBuildingId } from '@/balancing/config/idleVillage/villageBuildingsConfig';

/**
 * Village director asset contract (pilot): the base plate painted without
 * buildings + the per-building sprite map used by `VillageDirectorView`.
 * `sprites` maps a painted building id to its sprite file; ids missing from
 * the map fall back to `defaultSprite` (the thatched cottage stand-in) so the
 * director can stage every slot before the full building battery exists.
 */
const villageDirectorAssetsSchema = z.object({
  basePlate: z.string().min(1),
  defaultSprite: z.string().min(1),
  sprites: z.record(z.string(), z.string()),
});

export type VillageDirectorAssets = z.infer<typeof villageDirectorAssetsSchema>;

export const VILLAGE_DIRECTOR_ASSETS: VillageDirectorAssets = villageDirectorAssetsSchema.parse({
  basePlate: '/assets/village/base-plate.png',
  defaultSprite: '/assets/village/cottage.png',
  sprites: {
    inn: '/assets/village/inn.png',
    smithy: '/assets/village/smithy.png',
    watchtower: '/assets/village/watchtower.png',
    // populated as the per-building battery lands: farm, market, warehouse…
  } as Partial<Record<PaintedBuildingId, string>>,
});

/* ── Town-center model (Director ruling 2026-10-30, "modello B"): plots are
 *  FREE SLOTS — pure geometry on the base plate; any building type can be
 *  assigned to any plot. Seed positions are sensible meadow spots on
 *  `base-plate.png` (1589×672, normalized) — adjust via the director nudges. */
const villagePlotSchema = z.object({
  id: z.string(),
  x: z.number(), y: z.number(), // centro piazzola, normalizzato 0..1
  rx: z.number(), ry: z.number(), // semiassi ellisse footprint
});
export type VillagePlot = z.infer<typeof villagePlotSchema>;

/* Piazzole = centri dei `region` degli 11 edifici dipinti su villaggio.png
 *  (coordinate autoralate nel config — vbase vi è allineata). Modello B:
 *  qualunque tipo va su qualunque piazzola; `hint` è solo il ricordo di dove
 *  l'edificio era nel dipinto originale. */
export const VILLAGE_PLOTS: (VillagePlot & { hint?: string })[] = [
  { id: 'pl-inn',        x: 0.14, y: 0.55, rx: 0.055, ry: 0.075, hint: 'inn' },
  { id: 'pl-quarry',     x: 0.20, y: 0.12, rx: 0.055, ry: 0.075, hint: 'quarry' },
  { id: 'pl-smithy',     x: 0.30, y: 0.54, rx: 0.055, ry: 0.075, hint: 'smithy' },
  { id: 'pl-farm',       x: 0.37, y: 0.74, rx: 0.055, ry: 0.075, hint: 'farm' },
  { id: 'pl-market',     x: 0.47, y: 0.60, rx: 0.055, ry: 0.075, hint: 'market' },
  { id: 'pl-infirmary',  x: 0.57, y: 0.60, rx: 0.055, ry: 0.075, hint: 'infirmary' },
  { id: 'pl-barracks',   x: 0.67, y: 0.50, rx: 0.055, ry: 0.075, hint: 'barracks' },
  { id: 'pl-lumbermill', x: 0.72, y: 0.20, rx: 0.055, ry: 0.075, hint: 'lumbermill' },
  { id: 'pl-palisade',   x: 0.10, y: 0.86, rx: 0.055, ry: 0.075, hint: 'palisade' },
  { id: 'pl-watchtower', x: 0.90, y: 0.12, rx: 0.055, ry: 0.075, hint: 'watchtower' },
  { id: 'pl-warehouse',  x: 0.86, y: 0.50, rx: 0.055, ry: 0.075, hint: 'warehouse' },
];

/** Building types assignable to a plot (chassis families share the cottage
 *  stand-in until the real battery lands). */
export const VILLAGE_PLOT_TYPES = [
  'house', 'inn', 'smithy', 'market', 'farm', 'lumbermill', 'quarry',
  'warehouse', 'infirmary', 'watchtower', 'barracks', 'mageTower',
] as const;
export type VillagePlotType = (typeof VILLAGE_PLOT_TYPES)[number];
