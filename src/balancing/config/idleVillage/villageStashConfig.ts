/**
 * Village stash (PLAN-032 SP-2, artifact r003).
 *
 * The mock inventory the painted village warehouse shows on `/game`: a curated,
 * display-only stock of consumables plus the marker contract for the building
 * POI that opens the panel. Deliberately NOT a real inventory system — nothing
 * here is spent, moved, persisted or synced with quest loadouts; the numbers
 * are balancing knobs so the teaser surfaces read like the game will.
 *
 * Validation is binding: a curated `itemId` that is not an offerable quest
 * consumable, a duplicate row, or a total above `capacityMax` fails at module
 * load (`parse` throws), never silently.
 */

import { z } from 'zod';
import { defaultQuestItems } from './quests/questItems';

/** Canvas bounds of the world manifest — marker coords must stay inside. */
export const WORLD_CANVAS = { widthPx: 4240, heightPx: 2828 } as const;

/** Building ids a `MapBuildingPoi` can open — 'merchant' added by SP-3. */
export type VillageBuildingId = 'stash' | 'merchant';

/** Keys of the building-icon map (`BUILDING_ICON_URLS` in MapBuildingPoi). */
export type VillageBuildingIconKey = 'warehouse' | 'market';

export const villageStashSchema = z
  .object({
    items: z
      .array(
        z.object({
          itemId: z.string().min(1),
          qty: z.number().int().positive(),
        }),
      )
      .min(3)
      .max(6),
    /** Display-only "n/max" label in the panel footer (product choice, recorded). */
    capacityMax: z.number().int().positive(),
    marker: z.object({
      buildingId: z.literal('stash'),
      /** Anchored on a painted building, not the village centre. */
      worldX: z.number().min(0).max(WORLD_CANVAS.widthPx),
      worldY: z.number().min(0).max(WORLD_CANVAS.heightPx),
      iconKey: z.enum(['warehouse']),
      panelId: z.literal('villageStash'),
    }),
    /** Panel chrome: the row texts wrap instead of truncating inside this width. */
    panel: z.object({ widthPx: z.number().positive() }),
  })
  .superRefine((cfg, ctx) => {
    const seen = new Set<string>();
    cfg.items.forEach((row, index) => {
      if (seen.has(row.itemId)) {
        ctx.addIssue({ code: 'custom', path: ['items', index, 'itemId'], message: `duplicate stash item "${row.itemId}"` });
      }
      seen.add(row.itemId);
      const item = defaultQuestItems[row.itemId];
      if (!item || item.kind !== 'consumable') {
        ctx.addIssue({ code: 'custom', path: ['items', index, 'itemId'], message: `"${row.itemId}" is not an offerable quest consumable` });
      }
    });
    const total = cfg.items.reduce((sum, row) => sum + row.qty, 0);
    if (total > cfg.capacityMax) {
      ctx.addIssue({ code: 'custom', path: ['capacityMax'], message: `sum(qty) ${total} exceeds capacityMax ${cfg.capacityMax}` });
    }
  });

export type VillageStashConfig = z.infer<typeof villageStashSchema>;

const RAW_VILLAGE_STASH_CONFIG = {
  items: [
    { itemId: 'quest_consumable_healing_draught', qty: 2 },
    { itemId: 'quest_consumable_lucky_coin', qty: 1 },
    { itemId: 'quest_consumable_forza', qty: 1 },
    { itemId: 'quest_consumable_percezione', qty: 1 },
    { itemId: 'quest_consumable_cura', qty: 1 },
    { itemId: 'quest_consumable_fumogeno', qty: 1 },
  ],
  capacityMax: 12,
  marker: {
    buildingId: 'stash',
    /* The big timbered longhouse on the east side of the painted village
     * cluster (village centre is ~2061,1567 — this sits on a roof, ~195
     * world units east of the invasion goblin's endpoint). */
    worldX: 2260,
    worldY: 1551,
    iconKey: 'warehouse',
    panelId: 'villageStash',
  },
  panel: { widthPx: 320 },
};

/** Validated village stash configuration. */
export const VILLAGE_STASH_CONFIG = villageStashSchema.parse(RAW_VILLAGE_STASH_CONFIG);
