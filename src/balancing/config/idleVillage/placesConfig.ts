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
    /**
     * Elliptical enamel ring around the diorama (modello battezzato
     * `refs/approved-fan-v65.png`, ruling Director 2026-11-14): N settori
     * anulari ellittici contigui — smalto per famiglia, separatori oro,
     * gemme sul rim, gonna sotto il bordo frontale. Le posizioni non sono
     * misurate carta-per-carta: la geometria è parametrica (ellissi).
     */
    fanRing: z
      .object({
        /** Reference space (mockup-hub-fan-village.jpg px). */
        refW: z.number().positive(),
        refH: z.number().positive(),
        /** Centro dell'anello (frazioni di refW/refH). */
        cx: z.number(),
        cy: z.number(),
        /** Semiassi del bordo esterno (frazioni di refW/refH). */
        outerRx: z.number().positive(),
        outerRy: z.number().positive(),
        /** Semiassi del foro interno (impronta del saucer del diorama). */
        innerRx: z.number().positive(),
        innerRy: z.number().positive(),
        /** Offset verticale del foro interno rispetto al centro (frac refH). */
        innerDy: z.number(),
        /** Numero di settori dell'anello (slot fissi). */
        slotsTotal: z.number().int().min(3),
        /** Angolo del primo separatore (gradi, 0=dx, + orario, -90=alto). */
        startAngleDeg: z.number(),
        /** Ampiezza angolare del separatore oro fra settori (gradi). */
        gapDeg: z.number().positive(),
        /** Quanto ogni lastra dipinta copre la precedente (gradi, lato CCW). */
        overlapDeg: z.number().positive(),
        /** Spessore del rim oro esterno (frazione di refH). */
        rimFrac: z.number().positive(),
        /** Altezza della gonna sotto il bordo frontale (frazione di refH). */
        skirtFrac: z.number().positive(),
        /** Dimensione icona = frazione dello spessore radiale del settore. */
        iconFrac: z.number().positive(),
        /** Oro del rim/separatori: [luce, base, ombra]. */
        gold: z.tuple([z.string(), z.string(), z.string()]),
        /** Smalto chiaro per famiglia (PoiType) + settore vuoto `empty`. */
        enamel: z.record(z.string(), z.string()),
        /** Smalto "scritto" (progress/done) per famiglia + `empty`. */
        familyDark: z.record(z.string(), z.string()),
        /** Base URL degli spicchi dipinti (slice-{slot}-{mat}.webp). */
        sliceBase: z.string(),
        /** PoiType → materiale spicchio dipinto (suffisso file). */
        familySlice: z.record(z.string(), z.string()),
        /** Base URL dei glifi dipinti (icon-{glyph}.webp). */
        iconGlyphBase: z.string(),
        /** Keyword (lowercase, match id/iconUrl) → nome glifo. */
        iconGlyphMap: z.record(z.string(), z.string()),
        /** Diorama centrale sopra l'anello. */
        diorama: z
          .object({
            x: z.number(),
            y: z.number(),
            hFrac: z.number().positive(),
            href: z.string(),
            aspect: z.number().positive(),
          })
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
   * Elliptical plate fan — geometric values fitted/measured with the Director
   * (layout-tool + stroke export 2026-11-14, baseline mockup-hub-fan-village):
   * - radial centre = point below the tower window, NOT the diorama base.
   * - axes = screen directions from the centre through the 5 visible saucer
   *   gems + 3 mirrored on the back rim (CYI=293.3).
   * - first 3 slots (NW/N/NE back) are permanent navy sockets;
   *   fill order is CW from the right side (MERCATO → FORGIA → AGRIC → MINA → TAGLIA).
   */
  /**
   * Slot map measured on `mockup-hub-fan-village.jpg` (1946×544): 14 wedge
   * cards, irregular rotations/sizes, shingled, around the central diorama.
   * NOT a regular fan — values come from the image, not a formula.
   * Draw order below is back → front (z = array index).
   */
  fanRing: {
    refW: 1946,
    refH: 544,
    cx: 0.512,
    cy: 0.50,
    outerRx: 0.185,
    outerRy: 0.50,
    innerRx: 0.045,
    innerRy: 0.065,
    innerDy: 0.035,
    /* Ruling Director: petali larghi 60° (6 slot — ogni petalo = 2 da
     * 30°), riempimento da NE (`startAngleDeg`, convenzione 0=est,
     * +=orario in y-down) in senso orario; gli slot vuoti non
     * renderizzano alcun petalo. */
    slotsTotal: 6,
    startAngleDeg: -45,
    gapDeg: 2.5,
    overlapDeg: 6.5,
    rimFrac: 0.014,
    skirtFrac: 0.050,
    iconFrac: 0.62,
    /* oro = brass HUD (skin-hud-brass-crest/mid/base): il ruling R-290
     * vieta l'oro lucido — niente highlight più chiari del crest HUD. */
    gold: ['#d8bd78', '#c2a355', '#5f3f16'],
    enamel: { job: '#1d7a4e', quest: '#1d4e89', event: '#5b2d7a', empty: '#16293f' },
    familyDark: { job: '#081e14', quest: '#081226', event: '#180a22', empty: '#060d18' },
    sliceBase: '/assets/ui/poi-radial/slices',
    familySlice: { job: 'emerald', quest: 'sapphire', event: 'amethyst', empty: 'empty' },
    iconGlyphBase: '/assets/ui/poi-radial/icons',
    iconGlyphMap: {
      taglia: 'axe', wood: 'axe', forest: 'axe', forage: 'axe', lumber: 'axe', log: 'axe',
      mina: 'pickaxe', mine: 'pickaxe', crystal: 'pickaxe', ore: 'pickaxe', quarry: 'pickaxe',
      agric: 'wheat', wheat: 'wheat', harvest: 'wheat', farm: 'wheat', apple: 'wheat',
      mercato: 'moneybag', market: 'moneybag', carav: 'moneybag', caravan: 'moneybag', trade: 'moneybag', coin: 'moneybag',
      swords: 'swords', arena: 'swords', militia: 'swords', sword: 'swords', goblin: 'swords', fight: 'swords', bandit: 'swords',
    },
    diorama: {
      x: 0.512,
      /* +0.014 vs precedente: il saucer scende nel socket — il labbro
         frontale del foro gli passa sopra il piede (ruling Director:
         incassato nelle slice, non appoggiato sopra) */
      y: 0.454,
      hFrac: 0.42,
      href: '/assets/ui/poi-radial/village-diorama.webp',
      aspect: 1.3078, // village-diorama.webp 1024×783
    },
  },
} as const;

export const PLACES_CONFIG: PlacesConfig = deepFreeze(PlacesConfigSchema.parse(RAW_PLACES_CONFIG));

/** Lookup helper — places are few; a linear scan is fine. */
export function placeById(placeId: string, config: PlacesConfig = PLACES_CONFIG): PlaceDefinition | undefined {
  return config.places.find((p) => p.placeId === placeId);
}
