/**
 * placesConfig — Luoghi autoriali della mappa (PLAN-117 rev. 5, T0.3+T0.5).
 *
 * ## T0.5 — Semantic draft (modello canonico)
 *
 *   Region 1:N Place 1:N POI
 *
 * - **Region**: entità geografica autoriale (`regions.json` su mappa2). Oggi le
 *   definizioni sono una baseline NON canonica — il re-bucketing semantico è
 *   F6 (D-14) e può spin-off in un piano successore (D-15).
 * - **Place**: nodo autoriale scritto nel manifest/config, collocato dentro una
 *   Region. Non emerge MAI dalla prossimità dei POI (aggregazione emergente
 *   bocciata dal Director, D-13). `Place ≡ Region` è ammesso solo come scelta
 *   esplicita del manifest (`regionWide: true`), mai implicita dello schema.
 * - **POI**: opportunità puntuale che appartiene obbligatoriamente a un Place
 *   (`poiConfig.placeId` — vedi `poiConfig.ts`).
 *
 * ## Invarianti di schema
 *
 * - `placeId` è un id opaco e STABILE: non deriva da coordinate né da regionId,
 *   così il re-bucketing di regions.json (F6) non invalida i riferimenti.
 * - `regionId` è PROVISIONAL fino a F6: campo marcato, non verificato per
 *   integrità referenziale nel core (diventa blocking al gate F6, OB-12).
 * - Le fixture sono marcate `fixture: true` e il loro contenuto è fake
 *   etichettato (D-2: mai scambiarle per contenuto reale).
 */
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

export const PlaceDefinitionSchema = z
  .object({
    /** Opaque stable id — never derived from coordinates or regionId. */
    placeId: z.string().min(1),
    /** Anchor point in world px (same space as `questPois` x/y). */
    worldPoint: z.object({ x: z.number(), y: z.number() }).strict(),
    /**
     * PROVISIONAL link to `regions.json` region id — not reference-checked
     * until gate F6 (re-bucketing may rewrite region ids).
     */
    regionId: z.string().min(1).optional(),
    /** True when the Place IS the whole Region (explicit manifest choice, D-13). */
    regionWide: z.boolean().optional(),
    /** i18n key for the place name (idleVillage namespace) — never a string. */
    titleKey: z.string().min(1),
    /** i18n key for the hover-card description. */
    bodyKey: z.string().optional(),
    /** Asset path for the hover-card image (alabaster card, D-5). */
    image: z.string().optional(),
    /** Activity ids offered by this Place (ordering by `placeOrdering.ts`). */
    activityIds: z.array(z.string()).default([]),
    /** Marks authored-but-fake fixture content (D-2: never treat as real). */
    fixture: z.boolean().optional(),
  })
  .strict();
export type PlaceDefinition = z.infer<typeof PlaceDefinitionSchema>;

export const PlacesConfigSchema = z
  .object({
    places: z.array(PlaceDefinitionSchema).min(1),
    /** Two-ring fan capacities: urgent activities take the inner ring. */
    fan: z
      .object({
        innerRingCapacity: z.number().int().min(1),
        outerRingCapacity: z.number().int().min(1),
      })
      .strict(),
  })
  .strict();
export type PlacesConfig = z.infer<typeof PlacesConfigSchema>;

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
};

const RAW_PLACES_CONFIG = {
  places: [
    {
      /**
       * FIXTURE (D-2) — the starting village as the first authored Place.
       * worldPoint ≈ village zone centre on mappa2 (village.json ~x=1260,y=505,
       * w=510,h=390 → centre ~1515,700). Content is fake until real
       * buildings/activities are connected.
       */
      placeId: 'place_village_start',
      worldPoint: { x: 1515, y: 700 },
      regionId: 'river_meadows',
      titleKey: 'idleVillage.places.villageStart.title',
      bodyKey: 'idleVillage.places.villageStart.body',
      activityIds: [],
      fixture: true,
    },
  ],
  fan: {
    innerRingCapacity: 4,
    outerRingCapacity: 8,
  },
} as const;

export const PLACES_CONFIG: PlacesConfig = deepFreeze(PlacesConfigSchema.parse(RAW_PLACES_CONFIG));

/** Lookup helper — places are few; a linear scan is fine. */
export function placeById(placeId: string, config: PlacesConfig = PLACES_CONFIG): PlaceDefinition | undefined {
  return config.places.find((p) => p.placeId === placeId);
}
