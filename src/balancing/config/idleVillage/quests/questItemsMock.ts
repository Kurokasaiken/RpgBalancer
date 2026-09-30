// ADAPTER — legacy preview shape backed by the canonical quest item pool
// (questItems.ts). Keeps the `effect` grouping expected by
// applyConsumableRiskEffects / useQuestAssignmentPreview until those call
// sites migrate to the canonical QuestItem type (MP-03+).

import { defaultQuestItems } from './questItems';

/** Legacy consumable shape consumed by the milestone-check UI and preview. */
export interface QuestItemMock {
  id: string;
  /** i18n key for the display label (idleVillage namespace). */
  labelKey: string;
  icon?: string;
  effect: {
    deathChanceDelta?: number; // percentage points
    injuryChanceDelta?: number; // percentage points
    rewardMultiplierDelta?: number; // additive, e.g. 0.1 = +10%
  };
}

/**
 * Consumables from the canonical pool (D3: party pool, applied on each check).
 * `qty` stays on the canonical item; the legacy shape only carries the per-use
 * effect deltas.
 */
export const MOCK_QUEST_ITEMS: QuestItemMock[] = Object.values(defaultQuestItems)
  .filter((item) => item.kind === 'consumable')
  .map((item) => ({
    id: item.id,
    labelKey: item.labelKey,
    icon: item.icon,
    effect: {
      deathChanceDelta: item.deathChanceDelta,
      injuryChanceDelta: item.injuryChanceDelta,
      rewardMultiplierDelta: item.rewardMultiplierDelta,
    },
  }));
