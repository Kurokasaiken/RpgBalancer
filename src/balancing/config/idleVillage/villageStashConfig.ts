/**
 * Village stash (PLAN-032 SP-2, artifact r003).
 *
 * The stock the painted village warehouse shows on `/game`: a curated shelf
 * of expedition consumables. PLAN-035 removed the continent-map marker — the
 * panel opens from the Village view's warehouse tooltip (plus the Panels menu
 * and the `v` shortcut). PLAN-036 (R-195) promoted the shelf to the planner
 * bag picker's source of truth — every shelf row must be a REAL packable
 * consumable (an `engineFlag` channel, per `isExpeditionItem`'s contract),
 * so what the village stocks is exactly what the bag can hold.
 *
 * PLAN-073: `qty` is now the reservation ledger's stock line — the shared
 * pool `useVillageStashStore` derives remaining availability from
 * `qty − (draft bags + committed runs)`. The Director's phase-one stock is
 * one copy of each consumable; raising a `qty` here is the ONLY way to stock
 * multiples — never hardcode quantities in UI code.
 *
 * Validation is binding: a curated `itemId` that is not an offerable quest
 * consumable or lacks an `engineFlag` channel, a duplicate row, or a total
 * above `capacityMax` fails at module load (`parse` throws), never silently.
 */

import { z } from 'zod';
import { defaultQuestItems } from './quests/questItems';
import { WAREHOUSE_STORAGE_CAPACITY } from './villageBuildingsConfig';

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
      /* PLAN-036: the shelf IS the bag picker's catalogue — a consumable
       *  without an engineFlag channel would sell a fake effect the bag
       *  cannot arm (same bar `isExpeditionItem` enforces downstream). */
      if (item && item.kind === 'consumable' && !item.engineFlag) {
        ctx.addIssue({ code: 'custom', path: ['items', index, 'itemId'], message: `"${row.itemId}" has no engineFlag channel — not bag-legal` });
      }
    });
    const total = cfg.items.reduce((sum, row) => sum + row.qty, 0);
    if (total > cfg.capacityMax) {
      ctx.addIssue({ code: 'custom', path: ['capacityMax'], message: `sum(qty) ${total} exceeds capacityMax ${cfg.capacityMax}` });
    }
  });

export type VillageStashConfig = z.infer<typeof villageStashSchema>;

const RAW_VILLAGE_STASH_CONFIG = {
  /* PLAN-036: the shelf is the expedition bag's catalogue — the six
   * canonical engine-backed consumables of `defaultQuestItems`/`QUEST_STASH`.
   * `healing_draught`/`lucky_coin` (no engineFlag — decorative) were
   * retired in favour of `corda`/`pozione`. */
  items: [
    /* PLAN-073 phase-one stock (Director): exactly ONE copy of each
     * consumable — claiming a row empties it until released. */
    { itemId: 'quest_consumable_forza', qty: 1 },
    { itemId: 'quest_consumable_percezione', qty: 1 },
    { itemId: 'quest_consumable_fumogeno', qty: 1 },
    { itemId: 'quest_consumable_corda', qty: 1 },
    { itemId: 'quest_consumable_cura', qty: 1 },
    { itemId: 'quest_consumable_pozione', qty: 1 },
  ],
  /* One source (R-234, DN-1): the Warehouse's storage capacity at its current level — the panel
   * said 12 while the Warehouse tooltip said 24. */
  capacityMax: WAREHOUSE_STORAGE_CAPACITY,
  panel: { widthPx: 320 },
};

/** Validated village stash configuration. */
export const VILLAGE_STASH_CONFIG = villageStashSchema.parse(RAW_VILLAGE_STASH_CONFIG);
