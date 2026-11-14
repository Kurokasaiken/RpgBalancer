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
    /**
     * Fan-of-cards radial (PLAN-117 sub-plan F2): each activity is a separate
     * enamelled card rotated around a shared pivot under the diorama.
     * Fixed arc — cards never resize for low activity counts (Director ruling).
     */
    fanCards: z
      .object({
        /** Reference space of the measured slot map (mockup-hub-fan-village.jpg px). */
        refW: z.number().positive(),
        refH: z.number().positive(),
        /**
         * All card positions in draw order (back → front), measured on the
         * approved mockup. Coordinates/sizes are fractions of refW/refH;
         * rotateDeg is the CSS rotation so the plate tip points along the
         * measured wedge axis.
         */
        slots: z.array(
          z
            .object({
              x: z.number(),
              y: z.number(),
              rotateDeg: z.number(),
              wFrac: z.number().positive(),
              hFrac: z.number().positive(),
            })
            .strict(),
        ),
        /** Slot indices (into `slots`) that can host activities, in fill order. */
        fillOrder: z.array(z.number().int().nonnegative()),
        /** Central diorama: normalized centre, height fraction, z above cards. */
        diorama: z
          .object({ x: z.number(), y: z.number(), hFrac: z.number().positive() })
          .strict(),
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
      titleKey: 'places.villageStart.title',
      bodyKey: 'places.villageStart.body',
      activityIds: [],
      fixture: true,
    },
  ],
  fan: {
    innerRingCapacity: 4,
    outerRingCapacity: 8,
  },
  /**
   * Slot map measured on `mockup-hub-fan-village.jpg` (1946×544): 14 wedge
   * cards, irregular rotations/sizes, shingled, around the central diorama.
   * NOT a regular fan — values come from the image, not a formula.
   * Draw order below is back → front (z = array index).
   */
  fanCards: {
    refW: 1946,
    refH: 544,
    slots: [
      /* 0  sockLT   — empty blue card behind TAGLIALEGNA            */ { x: 0.339, y: 0.266, rotateDeg: 10,   wFrac: 0.080, hFrac: 0.300 },
      /* 1  sockM    — empty blue card behind MERCATO/scroll        */ { x: 0.617, y: 0.350, rotateDeg: 23.5, wFrac: 0.108, hFrac: 0.340 },
      /* 2  sockR    — empty blue card behind MERCATO-2/scroll      */ { x: 0.766, y: 0.440, rotateDeg: -9.6,  wFrac: 0.080, hFrac: 0.220 },
      /* 3  sockL    — small green socket under TAGLIALEGNA         */ { x: 0.306, y: 0.930, rotateDeg: 0,    wFrac: 0.039, hFrac: 0.140 },
      /* 4  swords   — blue card, crossed swords                   */ { x: 0.838, y: 0.340, rotateDeg: 13,   wFrac: 0.105, hFrac: 0.330 },
      /* 5  MAPPA    — compass card, tip pointing left              */ { x: 0.244, y: 0.460, rotateDeg: 93.1, wFrac: 0.154, hFrac: 0.580 },
      /* 6  scroll   — green quest scroll card, top-right           */ { x: 0.763, y: 0.267, rotateDeg: 37,   wFrac: 0.130, hFrac: 0.340 },
      /* 7  MINA     — pickaxe card                                 */ { x: 0.380, y: 0.735, rotateDeg: 15,   wFrac: 0.100, hFrac: 0.370 },
      /* 8  MER2     — blue scales card                             */ { x: 0.768, y: 0.735, rotateDeg: 50,   wFrac: 0.108, hFrac: 0.370 },
      /* 9  TAGLIA   — axe card                                     */ { x: 0.383, y: 0.553, rotateDeg: 11.1, wFrac: 0.103, hFrac: 0.630 },
      /* 10 MERG     — gold moneybag card                           */ { x: 0.650, y: 0.500, rotateDeg: 37,   wFrac: 0.128, hFrac: 0.550 },
      /* 11 TAVERNA  — blue mug card, far right                     */ { x: 0.879, y: 0.717, rotateDeg: 100,  wFrac: 0.121, hFrac: 0.450 },
      /* 12 AGRIC    — wheat card, bottom centre-left               */ { x: 0.503, y: 0.900, rotateDeg: -154.1, wFrac: 0.159, hFrac: 0.420 },
      /* 13 FORGIA   — anvil card, bottom centre-right              */ { x: 0.620, y: 0.827, rotateDeg: 159.2, wFrac: 0.154, hFrac: 0.430 },
    ],
    fillOrder: [5, 9, 7, 12, 10, 13, 8, 6, 4, 11],
    diorama: { x: 0.493, y: 0.423, hFrac: 0.625 },
  },
} as const;

export const PLACES_CONFIG: PlacesConfig = deepFreeze(PlacesConfigSchema.parse(RAW_PLACES_CONFIG));

/** Lookup helper — places are few; a linear scan is fine. */
export function placeById(placeId: string, config: PlacesConfig = PLACES_CONFIG): PlaceDefinition | undefined {
  return config.places.find((p) => p.placeId === placeId);
}
