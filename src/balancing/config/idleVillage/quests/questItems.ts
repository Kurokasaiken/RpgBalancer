/**
 * Default quest item pool (MP-02).
 *
 * Sample loadout data exercising every field of {@link QuestItemSchema}:
 * a mount that halves duration while occupying the `mount` slot, stat/risk
 * equipment, a cover-granting trinket (D1) and party-pool consumables (D3).
 * Numbers are authored here — balancing knobs, never component constants.
 */

import { QuestItemsSchema, type QuestItem } from './questItems.schema';

const RAW_DEFAULT_QUEST_ITEMS: Record<string, QuestItem> = {
  quest_mount_draft_horse: {
    id: 'quest_mount_draft_horse',
    labelKey: 'missionPlanner.items.draftHorse',
    icon: '🐎',
    kind: 'equipment',
    // Occupies the mount slot: the speed boost is a real loadout trade-off.
    slot: 'mount',
    durationMult: 0.5,
  },
  quest_weapon_iron_blade: {
    id: 'quest_weapon_iron_blade',
    labelKey: 'missionPlanner.items.ironBlade',
    icon: '🗡️',
    kind: 'equipment',
    slot: 'weapon',
    statDeltas: { strength: 4, endurance: 1 },
  },
  quest_armor_heavy_plate: {
    id: 'quest_armor_heavy_plate',
    labelKey: 'missionPlanner.items.heavyPlate',
    icon: '🛡️',
    kind: 'equipment',
    slot: 'armor',
    // Slower but safer: protection now, more time on the road.
    deathChanceDelta: -8,
    durationDelta: 1,
  },
  quest_trinket_guardian_banner: {
    id: 'quest_trinket_guardian_banner',
    labelKey: 'missionPlanner.items.guardianBanner',
    icon: '🚩',
    kind: 'equipment',
    slot: 'trinket',
    // Cover (D1): everyone else is safer while the banner bearer stands.
    coverRiskDelta: { injuryChance: -6, deathChance: -4 },
  },
  quest_consumable_healing_draught: {
    id: 'quest_consumable_healing_draught',
    labelKey: 'missionPlanner.items.healingDraught',
    icon: '🧪',
    kind: 'consumable',
    // Party pool (D3): applies to every living member's roll on each phase.
    injuryChanceDelta: -10,
    qty: 2,
  },
  quest_consumable_lucky_coin: {
    id: 'quest_consumable_lucky_coin',
    labelKey: 'missionPlanner.items.luckyCoin',
    icon: '🪙',
    kind: 'consumable',
    rewardMultiplierDelta: 0.1,
    qty: 1,
  },
  /* --------------------------------------------------------------------
   * Expedition-bag items (PLAN-019-S2.2 T-5): the real item identity behind
   * each graph-engine stash flag. `engineFlag` is the bridge — the engine
   * consumes flags (I-3), the catalog owns the player-facing id/label/qty.
   * Effect numbers stay in `questStash` (engine vocabulary, single source).
   * -------------------------------------------------------------------- */
  quest_consumable_forza: {
    id: 'quest_consumable_forza',
    labelKey: 'questS1Lab.item.bonusForza',
    icon: 'axe',
    kind: 'consumable',
    qty: 1,
    engineFlag: 'hasBonusForza',
  },
  quest_consumable_percezione: {
    id: 'quest_consumable_percezione',
    labelKey: 'questS1Lab.item.bonusPerc',
    icon: 'crosshair',
    kind: 'consumable',
    qty: 1,
    engineFlag: 'hasBonusPerc',
  },
  quest_consumable_fumogeno: {
    id: 'quest_consumable_fumogeno',
    labelKey: 'questS1Lab.item.smoke',
    icon: 'wind',
    kind: 'consumable',
    qty: 1,
    engineFlag: 'hasFumogeno',
  },
  quest_consumable_corda: {
    id: 'quest_consumable_corda',
    labelKey: 'questS1Lab.item.rope',
    icon: 'cable',
    kind: 'consumable',
    qty: 1,
    engineFlag: 'hasCorda',
  },
  quest_consumable_cura: {
    id: 'quest_consumable_cura',
    labelKey: 'questS1Lab.item.healing',
    icon: 'heart',
    kind: 'consumable',
    qty: 1,
    engineFlag: 'hasHealing',
  },
  quest_consumable_pozione: {
    id: 'quest_consumable_pozione',
    labelKey: 'questS1Lab.item.potion',
    icon: 'droplets',
    kind: 'consumable',
    qty: 1,
    engineFlag: 'hasPozione',
  },
};

/** Validated default quest item dictionary. */
export const defaultQuestItems = QuestItemsSchema.parse(RAW_DEFAULT_QUEST_ITEMS);

/**
 * Loads a quest item by id, throwing a descriptive error when missing.
 * @param itemId - Identifier to locate.
 * @param items - Optional override dictionary (defaults to validated defaults).
 */
export function loadQuestItem(
  itemId: string,
  items: Record<string, QuestItem> = defaultQuestItems,
): QuestItem {
  const item = items[itemId];
  if (!item) {
    throw new Error(`Quest item with id "${itemId}" was not found.`);
  }
  return item;
}

/**
 * Validates an unknown payload against the QuestItems schema.
 * @param value - Raw item dictionary to validate.
 * @returns Sanitised quest item dictionary.
 */
export function validateQuestItems(value: unknown): Record<string, QuestItem> {
  return QuestItemsSchema.parse(value);
}

/* ------------------------------------------------------------------------ */
/* Engine-flag aliases (PLAN-019-S2.2 T-5)                                   */
/* ------------------------------------------------------------------------ */

/** itemId → engine flag for catalog entries that bridge to the graph engine. */
export const QUEST_ITEM_TO_FLAG: ReadonlyMap<string, string> = new Map(
  Object.values(defaultQuestItems)
    .filter((i) => i.engineFlag)
    .map((i) => [i.id, i.engineFlag as string]),
);

/** Historic engine flag → catalog item id (the r2 alias map). */
export const QUEST_FLAG_TO_ITEM: ReadonlyMap<string, string> = new Map(
  Object.values(defaultQuestItems)
    .filter((i) => i.engineFlag)
    .map((i) => [i.engineFlag as string, i.id]),
);

/**
 * Translates a loadout entry to its engine flag: catalog item ids become
 * their `engineFlag`, historic flags pass through unchanged.
 * @param entry - Item id or engine flag.
 * @returns The engine flag (unresolved entries returned as-is for the
 *   caller's known-flag filter to drop).
 */
export function toEngineFlag(entry: string): string {
  return QUEST_ITEM_TO_FLAG.get(entry) ?? entry;
}
