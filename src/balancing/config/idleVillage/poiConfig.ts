/**
 * poiConfig — POI della mappa nel layer opportunità (PLAN-117 rev. 5, T0.3).
 *
 * `MapPOIType` ha 3 tipi (D-9): `quest`, `job`, `event` dove `event` è un
 * EVENTO LOCALE puntuale con scadenza — distinto da `StrategicEventKind`
 * (obiettivi medio/lungo termine, mai marker mappa — vedi `eventsConfig.ts`,
 * D-12). La distinzione è architetturale: un POI vive sulla mappa dentro un
 * Place; un Evento strategico vive solo nella timeline dedicata.
 *
 * Ogni POI appartiene obbligatoriamente a un Place (`placeId`, D-13): i
 * Luoghi sono autoriali, non emergono dalla vicinanza. `placeId` deve
 * esistere in `placesConfig` — integrità referenziale verificata da
 * `placesConfig.test.ts` (OB-5).
 *
 * Questo modulo NON sostituisce `quests/questPois.ts` (config dell'offerta
 * quest per il planner, superficie `/gameOld`): qui sta il modello nuovo del
 * layer opportunità; la riconciliazione è lavoro successivo (fuori core).
 */
import { z } from 'zod';

export const MapPoiTypeSchema = z.enum(['quest', 'job', 'event']);
export type MapPoiType = z.infer<typeof MapPoiTypeSchema>;

export const MapPoiDefinitionSchema = z
  .object({
    id: z.string().min(1),
    type: MapPoiTypeSchema,
    /** Required Place membership (D-13) — referential integrity via test. */
    placeId: z.string().min(1),
    /**
     * Optional explicit anchor in world px; absent = the Place's own
     * `worldPoint` (POI co-located with its Place marker).
     */
    worldPoint: z.object({ x: z.number(), y: z.number() }).strict().optional(),
    /** Domain reference: quest id, job/activity id, or event definition id. */
    activityRef: z.string().min(1).optional(),
    /** i18n key for the marker/activity label — never a string. */
    titleKey: z.string().optional(),
    /** Turn index at which the POI disappears (drives the countdown ring). */
    deadlineTurn: z.number().int().nonnegative().optional(),
    /** Marks authored-but-fake fixture content (D-2). */
    fixture: z.boolean().optional(),
  })
  .strict();
export type MapPoiDefinition = z.infer<typeof MapPoiDefinitionSchema>;

export const PoiConfigSchema = z
  .object({
    pois: z.array(MapPoiDefinitionSchema),
  })
  .strict();
export type PoiConfig = z.infer<typeof PoiConfigSchema>;

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
};

const RAW_POI_CONFIG = {
  pois: [
    {
      /** FIXTURE (D-2) — fake quest POI on the village Place. */
      id: 'poi_fixture_village_quest',
      type: 'quest',
      placeId: 'place_village_start',
      activityRef: 'cassa',
      titleKey: 'idleVillage.places.villageStart.poiFixture',
      fixture: true,
    },
  ],
} as const;

export const POI_CONFIG: PoiConfig = deepFreeze(PoiConfigSchema.parse(RAW_POI_CONFIG));
