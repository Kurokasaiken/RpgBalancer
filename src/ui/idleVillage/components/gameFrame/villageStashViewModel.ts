import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import type { VillageStashConfig } from '@/balancing/config/idleVillage/villageStashConfig';

/**
 * One row of the stash list: everything the panel needs pre-resolved to i18n
 * keys, so the component stays a dumb renderer (same contract as the hero
 * sheet's view-model).
 */
export interface VillageStashRowView {
  itemId: string;
  /** `questItems` icon field — an emoji or a named icon the panel maps to an engraved glyph. */
  icon?: string;
  nameKey: string;
  descKey: string;
  qty: number;
}

export interface VillageStashViewModel {
  rows: VillageStashRowView[];
  /** sum(qty) — the displayed count is derived, never authored. */
  storedCount: number;
  capacityMax: number;
}

/**
 * The description a row shows. Catalog `descKey` first; for engine-flag items
 * the canonical effect text lives on the loadout stash entry the flag maps to
 * (per the `questItems` schema: "for flag items the stash's `descKey` wins");
 * the label is the last-resort fallback so a row never renders a bare name.
 */
export function resolveStashItemDescKey(itemId: string): string {
  const item = defaultQuestItems[itemId];
  if (!item) return itemId;
  if (item.descKey) return item.descKey;
  const stashDesc = item.engineFlag
    ? QUEST_STASH.items.find((entry) => entry.flag === item.engineFlag)?.descKey
    : undefined;
  return stashDesc ?? item.labelKey;
}

/**
 * Derives the panel rows from the validated stash config: item identity comes
 * from the canonical `questItems` catalog (config `superRefine` already proved
 * every `itemId` is an offerable consumable).
 */
export function villageStashViewModel(config: VillageStashConfig): VillageStashViewModel {
  const rows = config.items.map(({ itemId, qty }) => {
    const item = defaultQuestItems[itemId];
    return { itemId, icon: item?.icon, nameKey: item?.labelKey ?? itemId, descKey: resolveStashItemDescKey(itemId), qty };
  });
  return { rows, storedCount: rows.reduce((sum, row) => sum + row.qty, 0), capacityMax: config.capacityMax };
}
