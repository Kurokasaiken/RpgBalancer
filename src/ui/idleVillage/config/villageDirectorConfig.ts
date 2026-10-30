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
    // populated as the per-building battery lands: lumbermill, quarry, farm…
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

export const VILLAGE_PLOTS: VillagePlot[] = [
  { id: 'p1', x: 0.20, y: 0.66, rx: 0.085, ry: 0.11 },
  { id: 'p2', x: 0.36, y: 0.56, rx: 0.085, ry: 0.11 },
  { id: 'p3', x: 0.50, y: 0.44, rx: 0.075, ry: 0.10 },
  { id: 'p4', x: 0.62, y: 0.62, rx: 0.085, ry: 0.11 },
  { id: 'p5', x: 0.78, y: 0.55, rx: 0.085, ry: 0.11 },
  { id: 'p6', x: 0.30, y: 0.80, rx: 0.09, ry: 0.12 },
  { id: 'p7', x: 0.55, y: 0.84, rx: 0.09, ry: 0.12 },
  { id: 'p8', x: 0.84, y: 0.74, rx: 0.085, ry: 0.11 },
];

/** Building types assignable to a plot (chassis families share the cottage
 *  stand-in until the real battery lands). */
export const VILLAGE_PLOT_TYPES = [
  'house', 'inn', 'smithy', 'market', 'farm', 'lumbermill', 'quarry',
  'warehouse', 'infirmary', 'watchtower', 'barracks', 'mageTower',
] as const;
export type VillagePlotType = (typeof VILLAGE_PLOT_TYPES)[number];
