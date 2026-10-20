/**
 * Village buildings catalogue (PLAN-035/038/042, debate artifact r005,
 * Desiderata v30).
 *
 * The display data for the `/game` Settlement View (`VillageScreenView` +
 * `VillageRegistry` drawer). The catalog is a DISCRIMINATED UNION on
 * `slotKind`:
 *  - `painted` — the eleven buildings the painting `villaggio.png`
 *    (3168×1344, ≈21:9) physically contains. They carry `anchor` (pin
 *    position) + `region` (authoring footprint) and obey the PLAN-038
 *    geometry lints.
 *  - `registry` — settlement-scale buildings that exist ONLY in the
 *    registry list (mage tower, guild…). They have NO geometry: `anchor` and
 *    `region` are forbidden by the strict schema. `hasFootprint` is the only
 *    sanctioned derivation point — v1: `slotKind === 'painted'`.
 *
 * **Screen content only** — nothing here is spent, built, persisted or synced
 * with the economy; numbers are authored balancing knobs so the surface reads
 * like the game will (same convention as `villageStashConfig.ts` SP-2 and
 * `merchantConfig.ts` SP-3). `overlayArt` is a declared-but-inert seam for a
 * future img2img patch — no v1 entry sets it and the renderer never reads it.
 *
 * Validation is binding: duplicate ids, malformed i18n keys, a `built`
 * building at level 0, non-sequential tiers, a `registry` entry smuggling
 * geometry, or two painted anchors closer than `MIN_ANCHOR_DIST`
 * (aspect-corrected Euclidean distance on the painting) all fail at module
 * load (`parse` throws), never silently. The parsed export is deep-frozen —
 * `Object.isFrozen(buildings[0])` is asserted by the unit test.
 */

import { z } from 'zod';

/** The eleven buildings painted on `villaggio.png` — also the roving-tabindex
 *  order of the stage pin toolbar. Registry-only ids NEVER appear here. */
export const PAINTED_BUILDING_IDS = [
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
export type PaintedBuildingId = (typeof PAINTED_BUILDING_IDS)[number];

/** Settlement-scale buildings that live only in the registry drawer — no
 *  painted counterpart, no geometry. Order = deterministic catalog order. */
export const REGISTRY_BUILDING_IDS = [
  'mageTower',
  'adventurersGuild',
  'sanctuary',
  'alchemist',
  'cemetery',
] as const;
export type RegistryBuildingId = (typeof REGISTRY_BUILDING_IDS)[number];

/** Full catalog: painted first (stage order), then registry-only entries. */
export const BUILDING_IDS = [...PAINTED_BUILDING_IDS, ...REGISTRY_BUILDING_IDS] as const;
export type VillageBuildingCatalogId = (typeof BUILDING_IDS)[number];

export const BUILDING_CATEGORIES = ['production', 'civic', 'defense', 'arcane'] as const;
export type VillageBuildingCategory = (typeof BUILDING_CATEGORIES)[number];

export const BUILDING_STATES = ['built', 'buildable', 'locked'] as const;
export type VillageBuildingState = (typeof BUILDING_STATES)[number];

/** Painted canvas aspect (w/h) used to compare anchors in a square metric. */
export const VILLAGE_CANVAS = { widthPx: 3168, heightPx: 1344 } as const;
const ASPECT = VILLAGE_CANVAS.widthPx / VILLAGE_CANVAS.heightPx;

/** Minimum normalized distance between two pin anchors (aspect-corrected). */
export const MIN_ANCHOR_DIST = 0.08;

/** i18n key shape for village buildings (ids may be camelCase, e.g. mageTower). */
const VILLAGE_I18N_KEY = /^gameFrame\.village\.buildings\.[a-z][a-zA-Z]*\.(name|desc|effect)$/;
const VILLAGE_UNLOCK_KEY = /^gameFrame\.village\.buildings\.[a-z][a-zA-Z]*\.unlockHint$/;

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

/** Authoring bbox on the painted building — DATA only, never rendered
 *  (debate r002: the rendered mark is the derived ground footprint ellipse). */
const regionSchema = z
  .object({
    x: z.number().min(0).max(0.94),
    y: z.number().min(0).max(0.9),
    w: z.number().min(0.03).max(0.5),
    h: z.number().min(0.03).max(0.5),
  })
  .strict();
export type VillageBuildingRegion = z.infer<typeof regionSchema>;

/** Normalized position on the painting — pin center, translate(-50%,-50%). */
const anchorSchema = z
  .object({
    x: z.number().min(0.06).max(0.94),
    y: z.number().min(0.12).max(0.88),
  })
  .strict();

/** Fields every catalog entry carries regardless of `slotKind`. */
const sharedBuildingShape = {
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
  initialState: z.enum(BUILDING_STATES),
  initialLevel: z.number().int().min(0).max(5),
  /** Buildings whose tooltip offers a real panel action (PLAN-032 SP-2/SP-3). */
  panelAction: z.enum(['villageStash', 'merchant']).optional(),
  tiers: z.array(buildingTierSchema).min(1).max(5),
  /** INERT seam (debate D-7): a future img2img patch composited into this
   *  normalized region when a registry building is really constructed.
   *  Declared for type stability — NO v1 entry sets it and the renderer must
   *  never read it (enforced by a unit test). */
  overlayArt: z
    .object({ patchSrc: z.string().min(1), region: regionSchema })
    .strict()
    .optional(),
  /** Reserved (debate D-12): hide the real name in the registry until
   *  unlocked. Unused by v1 data — default is real name + lock badge. */
  spoiler: z.boolean().optional(),
};

/** Painted variant: geometry REQUIRED (anchor drives the pin, region drives
 *  the footprint ellipse and the geometry lints). */
const paintedBuildingSchema = z
  .object({
    ...sharedBuildingShape,
    slotKind: z.literal('painted'),
    anchor: anchorSchema,
    region: regionSchema,
    /** Per-building fallback for a region rejected by the Step-0 witness:
     *  overrides the derived footprint ellipse {cx,cy,rx} (ry = 0.2·rx), same
     *  normalized space. */
    ellipseOverride: z
      .object({ cx: z.number(), cy: z.number(), rx: z.number() })
      .optional(),
    /** 4 stake ticks drawn as subpaths of the ground ring (works fiction). */
    stakeTicks: z.boolean().optional(),
    /** Pin offset in normalized stage units — sits the pin on the roofline
     *  instead of the region centroid. |y| capped at 0.04 by lint below. */
    anchorNudge: z.object({ x: z.number(), y: z.number() }).optional(),
  })
  .strict();

/** Registry variant: geometry FORBIDDEN — `.strict()` makes `anchor`,
 *  `region`, `ellipseOverride`, `stakeTicks` and `anchorNudge` parse errors. */
const registryBuildingSchema = z
  .object({
    ...sharedBuildingShape,
    slotKind: z.literal('registry'),
  })
  .strict();

/** Catalog entry — discriminated union on `slotKind` (PLAN-042, artifact
 *  r005). Narrow with `b.slotKind` or the `hasFootprint` guard. */
export const villageBuildingSchema = z.discriminatedUnion('slotKind', [
  paintedBuildingSchema,
  registryBuildingSchema,
]);

export const villageBuildingsSchema = z
  .object({ buildings: z.array(villageBuildingSchema).length(BUILDING_IDS.length) })
  .superRefine((cfg, ctx) => {
    const paintedIdSet = new Set<string>(PAINTED_BUILDING_IDS);
    const registryIdSet = new Set<string>(REGISTRY_BUILDING_IDS);
    const seen = new Set<string>();
    cfg.buildings.forEach((b, index) => {
      if (seen.has(b.id)) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'id'], message: `duplicate building id "${b.id}"` });
      }
      seen.add(b.id);
      /* slotKind ↔ id coherence: the two id tables are authoritative — a
       * painted id declared `registry` (or vice versa) is a data bug that
       * would silently drop geometry or invent a pin-less painted entry. */
      if (b.slotKind === 'painted' && !paintedIdSet.has(b.id)) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'slotKind'], message: `"${b.id}" is painted but not in PAINTED_BUILDING_IDS` });
      }
      if (b.slotKind === 'registry' && !registryIdSet.has(b.id)) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'slotKind'], message: `"${b.id}" is registry but not in REGISTRY_BUILDING_IDS` });
      }
      if (b.initialState === 'built' && b.initialLevel < 1) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'initialLevel'], message: `"${b.id}" is 'built' but initialLevel < 1` });
      }
      if (b.initialState !== 'built' && b.initialLevel !== 0) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'initialLevel'], message: `"${b.id}" is not 'built' but initialLevel !== 0` });
      }
      if (b.initialState === 'locked' && !b.unlockHintKey) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'unlockHintKey'], message: `"${b.id}" is 'locked' without unlockHintKey` });
      }
      /* PLAN-038 geometry lints (artifact-r003) — blocking, painted entries
       * only (registry entries have no region by schema). */
      if (b.slotKind !== 'painted') return;
      const r = b.region;
      if (r.x + r.w > 1 || r.y + r.h > 1) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'region'], message: `"${b.id}" region exceeds the painting` });
      }
      const ax = b.anchor.x, ay = b.anchor.y;
      if (ax < r.x - 1e-9 || ax > r.x + r.w + 1e-9 || ay < r.y - 1e-9 || ay > r.y + r.h + 1e-9) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'anchor'], message: `"${b.id}" anchor outside its region` });
      }
      if (b.anchorNudge && Math.abs(b.anchorNudge.y) > 0.04) {
        ctx.addIssue({ code: 'custom', path: ['buildings', index, 'anchorNudge'], message: `"${b.id}" anchorNudge.y exceeds 0.04 of stage height` });
      }
      /* Pin-on-region overlap: pin rect = anchor ±20 CSS px at the 1280×543
       * rendered stage → ±0.015625 x, ±0.03682 y normalized. Regions narrower
       * than 100 CSS px (w·1280 < 100) must keep the pin ≤35% inside them. */
      const pinHalfX = 20 / 1280;
      const pinHalfY = 20 / 543;
      if (r.w * 1280 < 100) {
        const ox = Math.max(0, Math.min(ax + pinHalfX, r.x + r.w) - Math.max(ax - pinHalfX, r.x));
        const oy = Math.max(0, Math.min(ay + pinHalfY, r.y + r.h) - Math.max(ay - pinHalfY, r.y));
        const overlap = (ox * oy) / (2 * pinHalfX * 2 * pinHalfY);
        if (overlap > 0.35) {
          ctx.addIssue({ code: 'custom', path: ['buildings', index, 'region'], message: `"${b.id}" narrow region swallows the pin (${(overlap * 100).toFixed(0)}% > 35%)` });
        }
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
     * never overlap on the painting at any viewport. Painted entries only. */
    const painted = cfg.buildings.filter((b) => b.slotKind === 'painted');
    for (let i = 0; i < painted.length; i += 1) {
      for (let j = i + 1; j < painted.length; j += 1) {
        const a = painted[i].anchor;
        const b = painted[j].anchor;
        const dist = Math.hypot((a.x - b.x) * ASPECT, a.y - b.y);
        if (dist < MIN_ANCHOR_DIST) {
          ctx.addIssue({
            code: 'custom',
            path: ['buildings', cfg.buildings.indexOf(painted[j]), 'anchor'],
            message: `"${painted[j].id}" anchor too close to "${painted[i].id}" (${dist.toFixed(3)} < ${MIN_ANCHOR_DIST})`,
          });
        }
        /* ≥44 CSS px between anchors at the 1280×543 rendered stage. */
        const screenDist = Math.hypot((a.x - b.x) * 1280, (a.y - b.y) * 543);
        if (screenDist < 44) {
          ctx.addIssue({
            code: 'custom',
            path: ['buildings', cfg.buildings.indexOf(painted[j]), 'anchor'],
            message: `"${painted[j].id}" anchor ${screenDist.toFixed(0)}px from "${painted[i].id}" on screen (<44px)`,
          });
        }
        /* Region pairwise overlap ≤15% of the smaller. */
        const ra = painted[i].region, rb = painted[j].region;
        const ox = Math.max(0, Math.min(ra.x + ra.w, rb.x + rb.w) - Math.max(ra.x, rb.x));
        const oy = Math.max(0, Math.min(ra.y + ra.h, rb.y + rb.h) - Math.max(ra.y, rb.y));
        const overlap = ox * oy;
        const smaller = Math.min(ra.w * ra.h, rb.w * rb.h);
        if (overlap > smaller * 0.15) {
          ctx.addIssue({
            code: 'custom',
            path: ['buildings', cfg.buildings.indexOf(painted[j]), 'region'],
            message: `"${painted[j].id}" region overlaps "${painted[i].id}" by ${((overlap / smaller) * 100).toFixed(0)}% (>15%)`,
          });
        }
      }
    }
  });

export type VillageBuildingDefinition = z.infer<typeof villageBuildingSchema>;
/** Painted variant — narrows to the branch carrying `anchor`/`region`. */
export type PaintedVillageBuilding = Extract<VillageBuildingDefinition, { slotKind: 'painted' }>;
/** Registry-only variant — no geometry by construction. */
export type RegistryVillageBuilding = Extract<VillageBuildingDefinition, { slotKind: 'registry' }>;
export type VillageBuildingsConfig = z.infer<typeof villageBuildingsSchema>;

/**
 * The ONLY sanctioned derivation of "does this building occupy a footprint on
 * the painting" (artifact r005, D-5). v1 equivalent of `slotKind === 'painted'`
 * — keep every renderer/site keyed through this guard so the union can evolve
 * (e.g. future `overlayArt`-backed presence) without touching consumers.
 */
export const hasFootprint = (b: VillageBuildingDefinition): b is PaintedVillageBuilding => b.slotKind === 'painted';

/**
 * Registry drawer constants (PLAN-042). `widthPx` is the slide-over width over
 * the stage's right edge; `viewports` is the supported occlusion-report
 * matrix (w×h pairs, stage ≈ min(vw, vh·ASPECT) — the letterbox measure the
 * view performs at runtime).
 */
export const VILLAGE_REGISTRY = {
  widthPx: 400,
  viewports: [
    { w: 1280, h: 800 },
    { w: 1440, h: 900 },
    { w: 1920, h: 1080 },
  ] as const,
} as const;

/** Derived ground footprint ellipse for a painted building — canvas pixel
 *  units (viewBox space). The authoring `region` is the bounding box; the
 *  rendered mark is this ellipse (cy = y + 0.92·h, rx = w/2, ry = 0.2·rx),
 *  overridable per building via `ellipseOverride`. */
export const footprintOf = (b: PaintedVillageBuilding): { cx: number; cy: number; rx: number; ry: number } => {
  if (b.ellipseOverride) {
    const { cx, cy, rx } = b.ellipseOverride;
    return { cx: cx * VILLAGE_CANVAS.widthPx, cy: cy * VILLAGE_CANVAS.heightPx, rx: rx * VILLAGE_CANVAS.widthPx, ry: rx * 0.2 * VILLAGE_CANVAS.widthPx };
  }
  const rx = (b.region.w * VILLAGE_CANVAS.widthPx) / 2;
  return {
    cx: (b.region.x + b.region.w / 2) * VILLAGE_CANVAS.widthPx,
    cy: (b.region.y + b.region.h * 0.92) * VILLAGE_CANVAS.heightPx,
    rx,
    ry: rx * 0.2,
  };
};

/** Viewport key of the supported occlusion matrix (`'1280' | '1440' | '1920'`). */
export type OcclusionViewportKey = `${(typeof VILLAGE_REGISTRY.viewports)[number]['w']}`;

/** Per-viewport occlusion flags for one painted building: `footprint` = the
 *  footprint ellipse's centre lands under the drawer strip; `anchor` = the pin
 *  is under it. Row-internal glow is the universal fallback, so occlusion is
 *  never a dead end — it only decides WHERE the highlight appears. */
export interface OcclusionReport {
  footprint: boolean;
  anchor: boolean;
}

/**
 * Occlusion of a painted building at a given viewport, with the registry
 * drawer open at the stage's right edge (artifact r005, D-10 — a REPORT, not
 * a gate: footprints follow the painting and may be partially occluded; the
 * hard lint stays on anchors already bounded to the painting).
 */
export const occludedAt = (b: PaintedVillageBuilding, viewport: { w: number; h: number }): OcclusionReport => {
  const stageW = Math.min(viewport.w, viewport.h * ASPECT);
  const drawerLeftNorm = 1 - VILLAGE_REGISTRY.widthPx / stageW;
  const ell = footprintOf(b);
  return {
    footprint: ell.cx / VILLAGE_CANVAS.widthPx > drawerLeftNorm,
    anchor: b.anchor.x > drawerLeftNorm,
  };
};

/** Which surface receives the row-hover highlight for a painted building at a
 *  given stage width (px): the footprint ellipse when visible, else the pin
 *  ping, else the row's internal glow (registry-only behaviour). */
export type HighlightSurface = 'footprint' | 'pin' | 'row';
export const highlightSurfaceFor = (b: PaintedVillageBuilding, viewport: { w: number; h: number }): HighlightSurface => {
  const occ = occludedAt(b, viewport);
  if (!occ.footprint) return 'footprint';
  if (!occ.anchor) return 'pin';
  return 'row';
};

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
      slotKind: 'painted',
      category: 'production',
      iconKey: 'lumbermill',
      nameKey: 'gameFrame.village.buildings.lumbermill.name',
      descKey: 'gameFrame.village.buildings.lumbermill.desc',
      effectKey: 'gameFrame.village.buildings.lumbermill.effect',
      /* Tall pines east of the village centre. */
      anchor: { x: 0.72, y: 0.2 },
      region: { x: 0.66, y: 0.0, w: 0.16, h: 0.3 },
      initialState: 'built',
      initialLevel: 2,
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 4 },
        { level: 2, cost: { wood: 30, iron: 5, gold: 15, food: 0 }, buildDays: 2, effectValue: 8 },
        { level: 3, cost: { wood: 60, iron: 15, gold: 40, food: 0 }, buildDays: 3, effectValue: 14 },
      ],
    },
    {
      id: 'quarry',
      slotKind: 'painted',
      category: 'production',
      iconKey: 'quarry',
      nameKey: 'gameFrame.village.buildings.quarry.name',
      descKey: 'gameFrame.village.buildings.quarry.desc',
      effectKey: 'gameFrame.village.buildings.quarry.effect',
      /* Rocky peaks west of the village. */
      anchor: { x: 0.2, y: 0.12 },
      region: { x: 0.08, y: 0.0, w: 0.22, h: 0.14 },
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
      slotKind: 'painted',
      category: 'production',
      iconKey: 'farm',
      nameKey: 'gameFrame.village.buildings.farm.name',
      descKey: 'gameFrame.village.buildings.farm.desc',
      effectKey: 'gameFrame.village.buildings.farm.effect',
      /* Green meadow along the stream, west of the footbridge. */
      anchor: { x: 0.37, y: 0.74 },
      region: { x: 0.26, y: 0.66, w: 0.2, h: 0.16 },
      initialState: 'built',
      initialLevel: 2,
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 5 },
        { level: 2, cost: { wood: 20, iron: 0, gold: 10, food: 0 }, buildDays: 2, effectValue: 10 },
        { level: 3, cost: { wood: 45, iron: 5, gold: 30, food: 0 }, buildDays: 3, effectValue: 16 },
      ],
    },
    {
      id: 'warehouse',
      slotKind: 'painted',
      category: 'civic',
      iconKey: 'warehouse',
      nameKey: 'gameFrame.village.buildings.warehouse.name',
      descKey: 'gameFrame.village.buildings.warehouse.desc',
      effectKey: 'gameFrame.village.buildings.warehouse.effect',
      /* The grand timbered longhouse on the east side. */
      anchor: { x: 0.86, y: 0.5 },
      region: { x: 0.78, y: 0.25, w: 0.19, h: 0.37 },
      initialState: 'built',
      initialLevel: 2,
      panelAction: 'villageStash',
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 12 },
        { level: 2, cost: { wood: 40, iron: 10, gold: 25, food: 0 }, buildDays: 2, effectValue: 24 },
        { level: 3, cost: { wood: 80, iron: 25, gold: 60, food: 0 }, buildDays: 4, effectValue: 48 },
      ],
    },
    {
      id: 'inn',
      slotKind: 'painted',
      category: 'civic',
      iconKey: 'inn',
      nameKey: 'gameFrame.village.buildings.inn.name',
      descKey: 'gameFrame.village.buildings.inn.desc',
      effectKey: 'gameFrame.village.buildings.inn.effect',
      /* The large foreground longhouse west, by the fence. */
      anchor: { x: 0.14, y: 0.55 },
      region: { x: 0.0, y: 0.16, w: 0.26, h: 0.5 },
      stakeTicks: true,
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
      slotKind: 'painted',
      category: 'civic',
      iconKey: 'smithy',
      nameKey: 'gameFrame.village.buildings.smithy.name',
      descKey: 'gameFrame.village.buildings.smithy.desc',
      effectKey: 'gameFrame.village.buildings.smithy.effect',
      /* Small thatched house mid-west. */
      anchor: { x: 0.3, y: 0.54 },
      region: { x: 0.24, y: 0.48, w: 0.14, h: 0.2 },
      stakeTicks: true,
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
      slotKind: 'painted',
      category: 'civic',
      iconKey: 'market',
      nameKey: 'gameFrame.village.buildings.market.name',
      descKey: 'gameFrame.village.buildings.market.desc',
      effectKey: 'gameFrame.village.buildings.market.effect',
      /* The square between the central houses. */
      anchor: { x: 0.47, y: 0.6 },
      region: { x: 0.42, y: 0.53, w: 0.09, h: 0.11 },
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
      slotKind: 'painted',
      category: 'civic',
      iconKey: 'infirmary',
      nameKey: 'gameFrame.village.buildings.infirmary.name',
      descKey: 'gameFrame.village.buildings.infirmary.desc',
      effectKey: 'gameFrame.village.buildings.infirmary.effect',
      unlockHintKey: 'gameFrame.village.buildings.infirmary.unlockHint',
      /* Quiet house on the stream bank, centre. */
      anchor: { x: 0.57, y: 0.6 },
      region: { x: 0.505, y: 0.5, w: 0.085, h: 0.18 },
      initialState: 'locked',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 45, iron: 5, gold: 35, food: 10 }, buildDays: 2, effectValue: 1 },
        { level: 2, cost: { wood: 70, iron: 10, gold: 60, food: 20 }, buildDays: 3, effectValue: 2 },
      ],
    },
    {
      id: 'palisade',
      slotKind: 'painted',
      category: 'defense',
      iconKey: 'palisade',
      nameKey: 'gameFrame.village.buildings.palisade.name',
      descKey: 'gameFrame.village.buildings.palisade.desc',
      effectKey: 'gameFrame.village.buildings.palisade.effect',
      /* Sharpened-stake fence in the west foreground. */
      anchor: { x: 0.1, y: 0.86 },
      region: { x: 0.0, y: 0.7, w: 0.29, h: 0.28 },
      initialState: 'built',
      initialLevel: 2,
      tiers: [
        { level: 1, cost: { wood: 0, iron: 0, gold: 0, food: 0 }, buildDays: 1, effectValue: 5 },
        { level: 2, cost: { wood: 50, iron: 10, gold: 0, food: 0 }, buildDays: 2, effectValue: 12 },
        { level: 3, cost: { wood: 90, iron: 30, gold: 20, food: 0 }, buildDays: 3, effectValue: 22 },
      ],
    },
    {
      id: 'watchtower',
      slotKind: 'painted',
      category: 'defense',
      iconKey: 'watchtower',
      nameKey: 'gameFrame.village.buildings.watchtower.name',
      descKey: 'gameFrame.village.buildings.watchtower.desc',
      effectKey: 'gameFrame.village.buildings.watchtower.effect',
      /* High ground among the tall trees, east. */
      anchor: { x: 0.9, y: 0.12 },
      region: { x: 0.85, y: 0.0, w: 0.12, h: 0.2 },
      stakeTicks: true,
    ellipseOverride: { cx: 0.9, cy: 0.335, rx: 0.05 },
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
      slotKind: 'painted',
      category: 'defense',
      iconKey: 'barracks',
      nameKey: 'gameFrame.village.buildings.barracks.name',
      descKey: 'gameFrame.village.buildings.barracks.desc',
      effectKey: 'gameFrame.village.buildings.barracks.effect',
      unlockHintKey: 'gameFrame.village.buildings.barracks.unlockHint',
      /* The two-storey house east of centre. */
      anchor: { x: 0.67, y: 0.5 },
      region: { x: 0.605, y: 0.38, w: 0.19, h: 0.3 },
      initialState: 'locked',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 60, iron: 15, gold: 40, food: 15 }, buildDays: 3, effectValue: 4 },
        { level: 2, cost: { wood: 90, iron: 30, gold: 70, food: 25 }, buildDays: 4, effectValue: 8 },
      ],
    },
    /* ——— Registry-only entries (PLAN-042): settlement-scale buildings that
     *  live only in the registry drawer. NO region/anchor — the strict schema
     *  rejects geometry on slotKind 'registry'. ——— */
    {
      id: 'mageTower',
      slotKind: 'registry',
      category: 'arcane',
      iconKey: 'mageTower',
      nameKey: 'gameFrame.village.buildings.mageTower.name',
      descKey: 'gameFrame.village.buildings.mageTower.desc',
      effectKey: 'gameFrame.village.buildings.mageTower.effect',
      /* Buildable in v1: the arcane category shows a real state transition. */
      initialState: 'buildable',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 80, iron: 20, gold: 120, food: 0 }, buildDays: 4, effectValue: 1 },
        { level: 2, cost: { wood: 120, iron: 40, gold: 220, food: 0 }, buildDays: 5, effectValue: 2 },
        { level: 3, cost: { wood: 180, iron: 70, gold: 380, food: 0 }, buildDays: 6, effectValue: 3 },
      ],
    },
    {
      id: 'adventurersGuild',
      slotKind: 'registry',
      category: 'arcane',
      iconKey: 'adventurersGuild',
      nameKey: 'gameFrame.village.buildings.adventurersGuild.name',
      descKey: 'gameFrame.village.buildings.adventurersGuild.desc',
      effectKey: 'gameFrame.village.buildings.adventurersGuild.effect',
      unlockHintKey: 'gameFrame.village.buildings.adventurersGuild.unlockHint',
      initialState: 'locked',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 70, iron: 10, gold: 150, food: 20 }, buildDays: 3, effectValue: 1 },
        { level: 2, cost: { wood: 110, iron: 25, gold: 260, food: 35 }, buildDays: 4, effectValue: 2 },
      ],
    },
    {
      id: 'sanctuary',
      slotKind: 'registry',
      category: 'arcane',
      iconKey: 'sanctuary',
      nameKey: 'gameFrame.village.buildings.sanctuary.name',
      descKey: 'gameFrame.village.buildings.sanctuary.desc',
      effectKey: 'gameFrame.village.buildings.sanctuary.effect',
      unlockHintKey: 'gameFrame.village.buildings.sanctuary.unlockHint',
      initialState: 'locked',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 60, iron: 5, gold: 90, food: 15 }, buildDays: 3, effectValue: 1 },
        { level: 2, cost: { wood: 100, iron: 15, gold: 160, food: 25 }, buildDays: 4, effectValue: 2 },
      ],
    },
    {
      id: 'alchemist',
      slotKind: 'registry',
      category: 'arcane',
      iconKey: 'alchemist',
      nameKey: 'gameFrame.village.buildings.alchemist.name',
      descKey: 'gameFrame.village.buildings.alchemist.desc',
      effectKey: 'gameFrame.village.buildings.alchemist.effect',
      unlockHintKey: 'gameFrame.village.buildings.alchemist.unlockHint',
      initialState: 'locked',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 50, iron: 15, gold: 110, food: 0 }, buildDays: 3, effectValue: 1 },
        { level: 2, cost: { wood: 85, iron: 30, gold: 200, food: 0 }, buildDays: 4, effectValue: 2 },
      ],
    },
    {
      id: 'cemetery',
      slotKind: 'registry',
      category: 'arcane',
      iconKey: 'cemetery',
      nameKey: 'gameFrame.village.buildings.cemetery.name',
      descKey: 'gameFrame.village.buildings.cemetery.desc',
      effectKey: 'gameFrame.village.buildings.cemetery.effect',
      unlockHintKey: 'gameFrame.village.buildings.cemetery.unlockHint',
      initialState: 'locked',
      initialLevel: 0,
      tiers: [
        { level: 1, cost: { wood: 40, iron: 0, gold: 60, food: 10 }, buildDays: 2, effectValue: 1 },
        { level: 2, cost: { wood: 70, iron: 10, gold: 110, food: 15 }, buildDays: 3, effectValue: 2 },
      ],
    },
  ],
} satisfies { buildings: ReadonlyArray<unknown> };

/** Validated, deep-frozen village buildings configuration. */
export const VILLAGE_BUILDINGS_CONFIG = deepFreeze(villageBuildingsSchema.parse(RAW_VILLAGE_BUILDINGS));

/** A building's effect at the level the village shows today (`initialLevel`; 0 = not built). */
export const currentEffectValue = (b: VillageBuildingDefinition): number =>
  b.initialLevel > 0 ? b.tiers[b.initialLevel - 1].effectValue : 0;

/** DN-1 (R-234): the Warehouse holds the village's items and its level sets the room — the
 *  stash panel's capacity reads this, the same number the Warehouse tooltip shows. */
export const WAREHOUSE_STORAGE_CAPACITY = currentEffectValue(
  VILLAGE_BUILDINGS_CONFIG.buildings.find((b) => b.id === 'warehouse') as VillageBuildingDefinition,
);

/** Precomputed occlusion matrix for the three supported viewports — data for
 *  tests/witnesses, never mutated. */
export const OCCLUSION_REPORT: Record<PaintedBuildingId, Record<OcclusionViewportKey, OcclusionReport>> = deepFreeze(
  Object.fromEntries(
    PAINTED_BUILDING_IDS.map((id) => {
      const b = VILLAGE_BUILDINGS_CONFIG.buildings.find((e) => e.id === id) as PaintedVillageBuilding;
      return [id, Object.fromEntries(VILLAGE_REGISTRY.viewports.map((v) => [`${v.w}`, occludedAt(b, v)]))];
    }),
  ) as Record<PaintedBuildingId, Record<OcclusionViewportKey, OcclusionReport>>,
);

const ROMAN = ['—', 'I', 'II', 'III', 'IV', 'V'] as const;

/**
 * Roman grade badge for a building pin: 0 renders as an em-dash (not built),
 * 1..5 as I..V. Pure helper, unit-tested.
 */
export const toRomanLevel = (level: number): string => ROMAN[Math.min(Math.max(Math.trunc(level), 0), 5)] ?? '—';
