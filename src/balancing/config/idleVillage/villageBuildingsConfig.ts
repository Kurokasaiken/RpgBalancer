/**
 * Village buildings catalogue (PLAN-035, artifact r005, Desiderata v30).
 *
 * The display data for the `/game` Settlement View (`VillageScreenView`):
 * every building painted on `villaggio.png` (3168×1344, ≈21:9) gets a pin at a
 * normalized `anchor` plus its full mock progression — tiers, costs, effects.
 * **Screen content only** — nothing here is spent, built, persisted or synced
 * with the economy; numbers are authored balancing knobs so the surface reads
 * like the game will (same convention as `villageStashConfig.ts` SP-2 and
 * `merchantConfig.ts` SP-3).
 *
 * Validation is binding: duplicate ids, malformed i18n keys, a `built`
 * building at level 0, non-sequential tiers, or two anchors closer than
 * `MIN_ANCHOR_DIST` (aspect-corrected Euclidean distance on the painting) all
 * fail at module load (`parse` throws), never silently. The parsed export is
 * deep-frozen — `Object.isFrozen(buildings[0])` is asserted by the unit test.
 */

import { z } from 'zod';

/** Building ids painted on `villaggio.png` — also the roving-tabindex order of the pin toolbar. */
export const BUILDING_IDS = [
  'lumbermill',
  'quarry',
  'farm',
  'warehouse',
  'inn',
  'smithy',
  'market',
  'infirmary',
  'palisade',
  'watchtower',
  'barracks',
] as const;
export type VillageBuildingCatalogId = (typeof BUILDING_IDS)[number];

export const BUILDING_CATEGORIES = ['production', 'civic', 'defense'] as const;
export type VillageBuildingCategory = (typeof BUILDING_CATEGORIES)[number];

export const BUILDING_STATES = ['built', 'buildable', 'locked'] as const;
export type VillageBuildingState = (typeof BUILDING_STATES)[number];

/** Painted canvas aspect (w/h) used to compare anchors in a square metric. */
export const VILLAGE_CANVAS = { widthPx: 3168, heightPx: 1344 } as const;
const ASPECT = VILLAGE_CANVAS.widthPx / VILLAGE_CANVAS.heightPx;

/** Minimum normalized distance between two pin anchors (aspect-corrected). */
export const MIN_ANCHOR_DIST = 0.08;

/** i18n key shape for village buildings. */
const VILLAGE_I18N_KEY = /^gameFrame\.village\.buildings\.[a-z]+\.(name|desc|effect)$/;
const VILLAGE_UNLOCK_KEY = /^gameFrame\.village\.buildings\.[a-z]+\.unlockHint$/;

/** One upgrade tier: resources spent (mock) to reach `level` and its effect value. */
export const buildingTierSchema = z.object({
  level: z.number().int().min(1).max(5),
  cost: z.object({
    wood: z.number().int().nonnegative(),
    iron: z.number().int().nonnegative(),
    gold: z.number().int().nonnegative(),
    food: z.number().int().nonnegative(),
  }),
  buildDays: z.number().int().positive(),
  /** Primary effect magnitude at this level (mock display value). */
  effectValue: z.number(),
  /** Optional second magnitude (e.g. capacity AND throughput). */
  secondaryValue: z.number().optional(),
});

export const villageBuildingSchema = z.object({
  id: z.enum(BUILDING_IDS),
  category: z.enum(BUILDING_CATEGORIES),
  /** 1:1 key into `VillageBuildingIcon` (`villageBuildingIcons.tsx`). */
  iconKey: z.enum(BUILDING_IDS),
  nameKey: z.string().regex(VILLAGE_I18N_KEY),
  descKey: z.string().regex(VILLAGE_I18N_KEY),
  /** ICU message rendered as `{value} → {next}` (current → next level). */
  effectKey: z.string().regex(VILLAGE_I18N_KEY),
  /** Required copy for `locked` buildings — why it cannot be built yet. */
  unlockHintKey: z.string().regex(VILLAGE_UNLOCK_KEY).optional(),
  /** Normalized position on the painting — pin center, translate(-50%,-50%). */
  anchor: z.object({
    x: z.number().min(0.06).max(0.94),
    y: z.number().min(0.12).max(0.88),
  }),
  initialState: z.enum(BUILDING_STATES),
  initialLevel: z.number().int().min(0).max(5),
  /** Buildings whose tooltip offers a real panel action (PLAN-032 SP-2/SP-3). */
  panelAction: z.enum(['villageStash', 'merchant']).optional(),
  tiers: z.array(buildingTierSchema).min(1).max(5),
});

export const villageBuildingsSchema = z
  .object({ buildings: z.array(villageBuildingSchema).length(BUILDING_IDS.length) })
  .superRefine((cfg, ctx) => {
    const seen = new Set<string>();
    cfg.buildings.forEach((b, index) => {
      if (seen.has(b.id)) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'id'], message: `duplicate building id "${b.id}"` });
      }
      seen.add(b.id);
      if (b.initialState === 'built' && b.initialLevel < 1) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'initialLevel'], message: `"${b.id}" is 'built' but initialLevel < 1` });
      }
      if (b.initialState !== 'built' && b.initialLevel !== 0) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'initialLevel'], message: `"${b.id}" is not 'built' but initialLevel !== 0` });
      }
      if (b.initialState === 'locked' && !b.unlockHintKey) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'unlockHintKey'], message: `"${b.id}" is 'locked' without unlockHintKey` });
      }
      b.tiers.forEach((tier, ti) => {
        if (tier.level !== ti + 1) {
          ctx.addIssue({ code: 'custom', path: ['buildings', index, 'tiers', ti, 'level'], message: `"${b.id}" tiers must be sequential 1..N` });
        }
      });
      if (b.initialLevel > b.tiers.length) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'initialLevel'], message: `"${b.id}" initialLevel exceeds tiers.length` });
      }
    });
    /* Anchor anti-collision: compare in aspect-corrected space so two pins can
     * never overlap on the painting at any viewport. */
    for (let i = 0; i < cfg.buildings.length; i += 1) {
      for (let j = i + 1; j < cfg.buildings.length; j += 1) {
        const a = cfg.buildings[i].anchor;
        const b = cfg.buildings[j].anchor;
        const dist = Math.hypot((a.x - b.x) * ASPECT, a.y - b.y);
        if (dist < MIN_ANCHOR_DIST) {
          ctx.addIssue({
            code: 'custom',
            path: ['buildings', j, 'anchor'],
            message: `"${cfg.buildings[j].id}" anchor too close to "${cfg.buildings[i].id}" (${dist.toFixed(3)} < ${MIN_ANCHOR_DIST})`,
          });
        }
      }
    }
  });

export type VillageBuildingDefinition = z.infer<typeof villageBuildingSchema>;
export type VillageBuildingsConfig = z.infer<typeof villageBuildingsSchema>;

/**
 * `Object.freeze` applied recursively (same convention as merchantConfig.ts):
 * Zod `.readonly()` freezes only the root, so the nested tiers would stay
 * mutable — we freeze the whole graph after `parse`.
 */
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
};

const RAW_VILLAGE_BUILDINGS = {
  buildings: [
    {
      id: 'lumbermill',
      category: 'production',
      iconKey: 'lumbermill',
      nameKey: 'gameFrame.village.buildings.lumbermill.name',
      descKey: 'gameFrame.village.buildings.lumbermill.desc',
      effectKey: 'gameFrame.village.buildings.lumbermill.effect',
      /* Tall pines east of the village centre. */
      anchor: { x: 0.72, y: 0.2 },
      initialState: 'built',
      initialLevel: 1,
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 4 },
        { level: 2, cost: { wood: 30, iron: 5, gold: 15, food: 0 }, buildDays: 2, effectValue: 8 },
        { level: 3, cost: { wood: 60, iron: 15, gold: 40, food: 0 }, buildDays: 3, effectValue: 14 },
      ],
    },
    {
      id: 'quarry',
      category: 'production',
      iconKey: 'quarry',
      nameKey: 'gameFrame.village.buildings.quarry.name',
      descKey: 'gameFrame.village.buildings.quarry.desc',
      effectKey: 'gameFrame.village.buildings.quarry.effect',
      /* Rocky peaks west of the village. */
      anchor: { x: 0.2, y: 0.12 },
      initialState: 'built',
      initialLevel: 1,
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 2 },
        { level: 2, cost: { wood: 25, iron: 0, gold: 20, food: 0 }, buildDays: 2, effectValue: 4 },
        { level: 3, cost: { wood: 50, iron: 10, gold: 50, food: 0 }, buildDays: 4, effectValue: 7 },
      ],
    },
    {
      id: 'farm',
      category: 'production',
      iconKey: 'farm',
      nameKey: 'gameFrame.village.buildings.farm.name',
      descKey: 'gameFrame.village.buildings.farm.desc',
      effectKey: 'gameFrame.village.buildings.farm.effect',
      /* Green meadow along the stream, west of the footbridge. */
      anchor: { x: 0.37, y: 0.74 },
      initialState: 'built',
      initialLevel: 1,
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 5 },
        { level: 2, cost: { wood: 20, iron: 0, gold: 10, food: 0 }, buildDays: 2, effectValue: 10 },
        { level: 3, cost: { wood: 45, iron: 5, gold: 30, food: 0 }, buildDays: 3, effectValue: 16 },
      ],
    },
    {
      id: 'warehouse',
      category: 'civic',
      iconKey: 'warehouse',
      nameKey: 'gameFrame.village.buildings.warehouse.name',
      descKey: 'gameFrame.village.buildings.warehouse.desc',
      effectKey: 'gameFrame.village.buildings.warehouse.effect',
      /* The grand timbered longhouse on the east side. */
      anchor: { x: 0.86, y: 0.5 },
      initialState: 'built',
      initialLevel: 1,
      panelAction: 'villageStash',
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 12 },
        { level: 2, cost: { wood: 40, iron: 10, gold: 25, food: 0 }, buildDays: 2, effectValue: 24 },
        { level: 3, cost: { wood: 80, iron: 25, gold: 60, food: 0 }, buildDays: 4, effectValue: 48 },
      ],
    },
    {
      id: 'inn',
      category: 'civic',
      iconKey: 'inn',
      nameKey: 'gameFrame.village.buildings.inn.name',
      descKey: 'gameFrame.village.buildings.inn.desc',
      effectKey: 'gameFrame.village.buildings.inn.effect',
      /* The large foreground longhouse west, by the fence. */
      anchor: { x: 0.14, y: 0.55 },
      initialState: 'buildable',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 40, iron: 0, gold: 30, food: 10 }, buildDays: 2, effectValue: 1 },
        { level: 2, cost: { wood: 60, iron: 10, gold: 50, food: 20 }, buildDays: 3, effectValue: 2 },
        { level: 3, cost: { wood: 90, iron: 20, gold: 80, food: 30 }, buildDays: 4, effectValue: 3 },
      ],
    },
    {
      id: 'smithy',
      category: 'civic',
      iconKey: 'smithy',
      nameKey: 'gameFrame.village.buildings.smithy.name',
      descKey: 'gameFrame.village.buildings.smithy.desc',
      effectKey: 'gameFrame.village.buildings.smithy.effect',
      /* Small thatched house mid-west. */
      anchor: { x: 0.3, y: 0.54 },
      initialState: 'buildable',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 35, iron: 20, gold: 25, food: 0 }, buildDays: 2, effectValue: 1 },
        { level: 2, cost: { wood: 55, iron: 35, gold: 45, food: 0 }, buildDays: 3, effectValue: 2 },
        { level: 3, cost: { wood: 80, iron: 55, gold: 75, food: 0 }, buildDays: 4, effectValue: 3 },
      ],
    },
    {
      id: 'market',
      category: 'civic',
      iconKey: 'market',
      nameKey: 'gameFrame.village.buildings.market.name',
      descKey: 'gameFrame.village.buildings.market.desc',
      effectKey: 'gameFrame.village.buildings.market.effect',
      /* The square between the central houses. */
      anchor: { x: 0.47, y: 0.6 },
      initialState: 'built',
      initialLevel: 1,
      panelAction: 'merchant',
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 3 },
        { level: 2, cost: { wood: 30, iron: 0, gold: 40, food: 10 }, buildDays: 2, effectValue: 6 },
        { level: 3, cost: { wood: 55, iron: 5, gold: 90, food: 20 }, buildDays: 3, effectValue: 12 },
      ],
    },
    {
      id: 'infirmary',
      category: 'civic',
      iconKey: 'infirmary',
      nameKey: 'gameFrame.village.buildings.infirmary.name',
      descKey: 'gameFrame.village.buildings.infirmary.desc',
      effectKey: 'gameFrame.village.buildings.infirmary.effect',
      unlockHintKey: 'gameFrame.village.buildings.infirmary.unlockHint',
      /* Quiet house on the stream bank, centre. */
      anchor: { x: 0.57, y: 0.6 },
      initialState: 'locked',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 45, iron: 5, gold: 35, food: 10 }, buildDays: 2, effectValue: 1 },
        { level: 2, cost: { wood: 70, iron: 10, gold: 60, food: 20 }, buildDays: 3, effectValue: 2 },
      ],
    },
    {
      id: 'palisade',
      category: 'defense',
      iconKey: 'palisade',
      nameKey: 'gameFrame.village.buildings.palisade.name',
      descKey: 'gameFrame.village.buildings.palisade.desc',
      effectKey: 'gameFrame.village.buildings.palisade.effect',
      /* Sharpened-stake fence in the west foreground. */
      anchor: { x: 0.1, y: 0.86 },
      initialState: 'built',
      initialLevel: 1,
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 5 },
        { level: 2, cost: { wood: 50, iron: 10, gold: 0, food: 0 }, buildDays: 2, effectValue: 12 },
        { level: 3, cost: { wood: 90, iron: 30, gold: 20, food: 0 }, buildDays: 3, effectValue: 22 },
      ],
    },
    {
      id: 'watchtower',
      category: 'defense',
      iconKey: 'watchtower',
      nameKey: 'gameFrame.village.buildings.watchtower.name',
      descKey: 'gameFrame.village.buildings.watchtower.desc',
      effectKey: 'gameFrame.village.buildings.watchtower.effect',
      /* High ground among the tall trees, east. */
      anchor: { x: 0.9, y: 0.12 },
      initialState: 'buildable',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 45, iron: 10, gold: 20, food: 0 }, buildDays: 2, effectValue: 1 },
        { level: 2, cost: { wood: 70, iron: 20, gold: 40, food: 0 }, buildDays: 3, effectValue: 2 },
        { level: 3, cost: { wood: 100, iron: 35, gold: 70, food: 0 }, buildDays: 4, effectValue: 3 },
      ],
    },
    {
      id: 'barracks',
      category: 'defense',
      iconKey: 'barracks',
      nameKey: 'gameFrame.village.buildings.barracks.name',
      descKey: 'gameFrame.village.buildings.barracks.desc',
      effectKey: 'gameFrame.village.buildings.barracks.effect',
      unlockHintKey: 'gameFrame.village.buildings.barracks.unlockHint',
      /* The two-storey house east of centre. */
      anchor: { x: 0.67, y: 0.5 },
      initialState: 'locked',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 60, iron: 15, gold: 40, food: 15 }, buildDays: 3, effectValue: 4 },
        { level: 2, cost: { wood: 90, iron: 30, gold: 70, food: 25 }, buildDays: 4, effectValue: 8 },
      ],
    },
  ],
} satisfies { buildings: ReadonlyArray<unknown> };

/** Validated, deep-frozen village buildings configuration. */
export const VILLAGE_BUILDINGS_CONFIG = deepFreeze(villageBuildingsSchema.parse(RAW_VILLAGE_BUILDINGS));

const ROMAN = ['—', 'I', 'II', 'III', 'IV', 'V'] as const;

/**
 * Roman grade badge for a building pin: 0 renders as an em-dash (not built),
 * 1..5 as I..V. Pure helper, unit-tested.
 */
export const toRomanLevel = (level: number): string => ROMAN[Math.min(Math.max(Math.trunc(level), 0), 5)] ?? '—';
